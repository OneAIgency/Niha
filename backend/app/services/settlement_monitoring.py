"""
Settlement Monitoring and Alerting Service

Provides monitoring capabilities for the settlement system:
- Health checks and metrics
- Overdue settlement detection
- Failed settlement tracking
- Alert generation for admin review
- Performance metrics

This service runs alongside the settlement processor to ensure
settlement health and identify issues requiring manual intervention.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import (
    Entity,
    SettlementBatch,
    SettlementStatus,
    User,
)
from ..services.email_service import EmailService

logger = logging.getLogger(__name__)


@dataclass
class SettlementMetrics:
    """Settlement system health metrics"""

    total_pending: int
    total_in_progress: int
    total_settled_today: int
    total_failed: int
    total_overdue: int
    avg_settlement_time_hours: Optional[float]
    total_value_pending_eur: Decimal
    total_value_settled_today_eur: Decimal
    oldest_pending_days: Optional[int]


@dataclass
class SettlementAlert:
    """Alert for settlement requiring attention"""

    severity: str  # "WARNING", "ERROR", "CRITICAL"
    settlement_id: str
    batch_reference: str
    alert_type: str
    message: str
    entity_name: str
    days_overdue: Optional[int] = None
    total_value_eur: Optional[Decimal] = None


class SettlementMonitoring:
    """Settlement monitoring and alerting service"""

    # Alert thresholds
    OVERDUE_WARNING_DAYS = 1  # Warn if 1 day past expected
    OVERDUE_CRITICAL_DAYS = 3  # Critical if 3 days past expected
    STUCK_STATUS_HOURS = 48  # Alert if stuck in same status for 48h

    @staticmethod
    async def get_system_metrics(db: AsyncSession) -> SettlementMetrics:
        """
        Get comprehensive settlement system metrics.

        Returns current state of all settlements including counts,
        values, and performance indicators.
        """
        # Count by status
        pending_count = await db.scalar(
            select(func.count(SettlementBatch.id)).where(
                SettlementBatch.status == SettlementStatus.PENDING
            )
        )

        in_progress_count = await db.scalar(
            select(func.count(SettlementBatch.id)).where(
                SettlementBatch.status.in_(
                    [
                        SettlementStatus.TRANSFER_INITIATED,
                        SettlementStatus.IN_TRANSIT,
                        SettlementStatus.AT_CUSTODY,
                    ]
                )
            )
        )

        # Settled today
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=None
        )
        settled_today_count = await db.scalar(
            select(func.count(SettlementBatch.id)).where(
                and_(
                    SettlementBatch.status == SettlementStatus.SETTLED,
                    SettlementBatch.updated_at >= today_start,
                )
            )
        )

        # Failed settlements
        failed_count = await db.scalar(
            select(func.count(SettlementBatch.id)).where(
                SettlementBatch.status == SettlementStatus.FAILED
            )
        )

        # Overdue settlements (past expected date but not SETTLED)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        overdue_count = await db.scalar(
            select(func.count(SettlementBatch.id)).where(
                and_(
                    SettlementBatch.expected_settlement_date < now,
                    SettlementBatch.status.notin_(
                        [SettlementStatus.SETTLED, SettlementStatus.FAILED]
                    ),
                )
            )
        )

        # Total value pending
        pending_value = await db.scalar(
            select(func.sum(SettlementBatch.total_value_eur)).where(
                SettlementBatch.status.notin_(
                    [SettlementStatus.SETTLED, SettlementStatus.FAILED]
                )
            )
        ) or Decimal("0")

        # Total value settled today
        settled_today_value = await db.scalar(
            select(func.sum(SettlementBatch.total_value_eur)).where(
                and_(
                    SettlementBatch.status == SettlementStatus.SETTLED,
                    SettlementBatch.updated_at >= today_start,
                )
            )
        ) or Decimal("0")

        # Average settlement time (PENDING → SETTLED)
        avg_time = None
        result = await db.execute(
            select(SettlementBatch)
            .where(
                and_(
                    SettlementBatch.status == SettlementStatus.SETTLED,
                    SettlementBatch.actual_settlement_date.isnot(None),
                )
            )
            .limit(100)  # Last 100 settlements
        )
        settled = result.scalars().all()
        if settled:
            total_hours = 0
            count = 0
            for s in settled:
                if s.actual_settlement_date:
                    duration = (
                        s.actual_settlement_date - s.created_at
                    ).total_seconds() / 3600
                    total_hours += duration
                    count += 1
            avg_time = total_hours / count if count > 0 else None

        # Oldest pending settlement
        oldest_pending_result = await db.execute(
            select(SettlementBatch)
            .where(
                SettlementBatch.status.notin_(
                    [SettlementStatus.SETTLED, SettlementStatus.FAILED]
                )
            )
            .order_by(SettlementBatch.created_at.asc())
            .limit(1)
        )
        oldest = oldest_pending_result.scalars().first()
        oldest_days = None
        if oldest:
            oldest_days = (now - oldest.created_at).days

        return SettlementMetrics(
            total_pending=pending_count or 0,
            total_in_progress=in_progress_count or 0,
            total_settled_today=settled_today_count or 0,
            total_failed=failed_count or 0,
            total_overdue=overdue_count or 0,
            avg_settlement_time_hours=avg_time,
            total_value_pending_eur=pending_value,
            total_value_settled_today_eur=settled_today_value,
            oldest_pending_days=oldest_days,
        )

    @staticmethod
    async def detect_alerts(db: AsyncSession) -> List[SettlementAlert]:
        """
        Detect settlements requiring attention.

        Scans for:
        - Overdue settlements (past expected date)
        - Failed settlements needing review
        - Settlements stuck in same status too long
        - High-value settlements requiring monitoring

        Returns list of alerts ordered by severity.
        """
        alerts: List[SettlementAlert] = []
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # === CRITICAL: Failed Settlements ===
        failed_result = await db.execute(
            select(SettlementBatch, Entity)
            .join(Entity, SettlementBatch.entity_id == Entity.id)
            .where(SettlementBatch.status == SettlementStatus.FAILED)
        )
        for settlement, entity in failed_result:
            alerts.append(
                SettlementAlert(
                    severity="CRITICAL",
                    settlement_id=str(settlement.id),
                    batch_reference=settlement.batch_reference,
                    alert_type="FAILED_SETTLEMENT",
                    message="Settlement failed - requires manual intervention",
                    entity_name=entity.name,
                    total_value_eur=settlement.total_value_eur,
                )
            )

        # === ERROR: Critically Overdue (3+ days past expected) ===
        critical_overdue = await db.execute(
            select(SettlementBatch, Entity)
            .join(Entity, SettlementBatch.entity_id == Entity.id)
            .where(
                and_(
                    SettlementBatch.expected_settlement_date
                    < now - timedelta(days=SettlementMonitoring.OVERDUE_CRITICAL_DAYS),
                    SettlementBatch.status.notin_(
                        [SettlementStatus.SETTLED, SettlementStatus.FAILED]
                    ),
                )
            )
        )
        for settlement, entity in critical_overdue:
            days_overdue = (now - settlement.expected_settlement_date).days
            alerts.append(
                SettlementAlert(
                    severity="ERROR",
                    settlement_id=str(settlement.id),
                    batch_reference=settlement.batch_reference,
                    alert_type="CRITICALLY_OVERDUE",
                    message=(
                        f"Settlement {days_overdue} days overdue - "
                        f"urgent review required"
                    ),
                    entity_name=entity.name,
                    days_overdue=days_overdue,
                    total_value_eur=settlement.total_value_eur,
                )
            )

        # === WARNING: Overdue (1+ days past expected) ===
        warning_overdue = await db.execute(
            select(SettlementBatch, Entity)
            .join(Entity, SettlementBatch.entity_id == Entity.id)
            .where(
                and_(
                    SettlementBatch.expected_settlement_date
                    < now - timedelta(days=SettlementMonitoring.OVERDUE_WARNING_DAYS),
                    SettlementBatch.expected_settlement_date
                    >= now - timedelta(days=SettlementMonitoring.OVERDUE_CRITICAL_DAYS),
                    SettlementBatch.status.notin_(
                        [SettlementStatus.SETTLED, SettlementStatus.FAILED]
                    ),
                )
            )
        )
        for settlement, entity in warning_overdue:
            days_overdue = (now - settlement.expected_settlement_date).days
            alerts.append(
                SettlementAlert(
                    severity="WARNING",
                    settlement_id=str(settlement.id),
                    batch_reference=settlement.batch_reference,
                    alert_type="OVERDUE",
                    message=f"Settlement {days_overdue} days overdue",
                    entity_name=entity.name,
                    days_overdue=days_overdue,
                    total_value_eur=settlement.total_value_eur,
                )
            )

        # === WARNING: Stuck in Status (48+ hours no progress) ===
        stuck_threshold = now - timedelta(hours=SettlementMonitoring.STUCK_STATUS_HOURS)
        stuck_result = await db.execute(
            select(SettlementBatch, Entity)
            .join(Entity, SettlementBatch.entity_id == Entity.id)
            .where(
                and_(
                    SettlementBatch.updated_at < stuck_threshold,
                    SettlementBatch.status.notin_(
                        [
                            SettlementStatus.PENDING,  # Expected to wait
                            SettlementStatus.SETTLED,
                            SettlementStatus.FAILED,
                        ]
                    ),
                )
            )
        )
        for settlement, entity in stuck_result:
            hours_stuck = (now - settlement.updated_at).total_seconds() / 3600
            alerts.append(
                SettlementAlert(
                    severity="WARNING",
                    settlement_id=str(settlement.id),
                    batch_reference=settlement.batch_reference,
                    alert_type="STUCK_IN_STATUS",
                    message=(
                        f"Settlement stuck in {settlement.status.value} "
                        f"for {int(hours_stuck)} hours"
                    ),
                    entity_name=entity.name,
                    total_value_eur=settlement.total_value_eur,
                )
            )

        # Sort by severity: CRITICAL > ERROR > WARNING
        severity_order = {"CRITICAL": 0, "ERROR": 1, "WARNING": 2}
        alerts.sort(key=lambda a: severity_order.get(a.severity, 3))

        return alerts

    @staticmethod
    async def generate_daily_report(db: AsyncSession) -> Dict[str, Any]:
        """
        Generate daily settlement system report.

        Includes:
        - System metrics
        - Active alerts
        - Settlements completed today
        - Performance summary

        Returns report dict suitable for email/dashboard display.
        """
        metrics = await SettlementMonitoring.get_system_metrics(db)
        alerts = await SettlementMonitoring.detect_alerts(db)

        # Get settlements completed today
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=None
        )
        completed_result = await db.execute(
            select(SettlementBatch, Entity)
            .join(Entity, SettlementBatch.entity_id == Entity.id)
            .where(
                and_(
                    SettlementBatch.status == SettlementStatus.SETTLED,
                    SettlementBatch.updated_at >= today_start,
                )
            )
        )
        completed_today = []
        for settlement, entity in completed_result:
            completed_today.append(
                {
                    "batch_reference": settlement.batch_reference,
                    "entity_name": entity.name,
                    "quantity": float(settlement.quantity),
                    "total_value_eur": float(settlement.total_value_eur),
                    "settlement_type": settlement.settlement_type.value,
                }
            )

        return {
            "report_date": datetime.now(timezone.utc).isoformat(),
            "metrics": {
                "total_pending": metrics.total_pending,
                "total_in_progress": metrics.total_in_progress,
                "settled_today": metrics.total_settled_today,
                "failed": metrics.total_failed,
                "overdue": metrics.total_overdue,
                "avg_settlement_time_hours": metrics.avg_settlement_time_hours,
                "pending_value_eur": float(metrics.total_value_pending_eur),
                "settled_today_value_eur": float(metrics.total_value_settled_today_eur),
                "oldest_pending_days": metrics.oldest_pending_days,
            },
            "alerts": [
                {
                    "severity": alert.severity,
                    "type": alert.alert_type,
                    "message": alert.message,
                    "batch_reference": alert.batch_reference,
                    "entity": alert.entity_name,
                    "days_overdue": alert.days_overdue,
                    "value_eur": float(alert.total_value_eur)
                    if alert.total_value_eur
                    else None,
                }
                for alert in alerts
            ],
            "completed_today": completed_today,
        }

    @staticmethod
    async def send_alert_emails(
        db: AsyncSession, alerts: List[SettlementAlert]
    ) -> None:
        """
        Send email alerts for critical issues.

        Only sends for CRITICAL and ERROR severity alerts.
        Batches multiple alerts into single email.
        """
        if not alerts:
            return

        # Filter to CRITICAL and ERROR only
        critical_alerts = [a for a in alerts if a.severity in ["CRITICAL", "ERROR"]]
        if not critical_alerts:
            return

        # Get admin users
        result = await db.execute(select(User).where(User.role == "ADMIN"))
        admins = result.scalars().all()

        if not admins:
            logger.warning("No admin users found to send settlement alerts")
            return

        # Format alert email
        alert_html = "<h2>Settlement System Alerts</h2><ul>"
        for alert in critical_alerts:
            alert_html += f"""
            <li>
                <strong>[{alert.severity}] {alert.alert_type}</strong><br>
                Batch: {alert.batch_reference}<br>
                Entity: {alert.entity_name}<br>
                {alert.message}<br>
                {f"Value: EUR {alert.total_value_eur:,.2f}"
                if alert.total_value_eur else ""}
            </li>
            """
        alert_html += "</ul>"

        # Send to all admins
        email_service = EmailService()
        for admin in admins:
            try:
                await email_service._send_email(
                    to_email=admin.email,
                    subject=(
                        f"[NIHA] Settlement System Alert - "
                        f"{len(critical_alerts)} Issue(s)"
                    ),
                    html_content=alert_html,
                )
                logger.info(f"Sent settlement alerts to {admin.email}")
            except Exception as e:
                logger.error(f"Failed to send alerts to {admin.email}: {e}")

    @staticmethod
    async def run_monitoring_cycle(db: AsyncSession) -> Dict[str, Any]:
        """
        Execute complete monitoring cycle.

        1. Collect metrics
        2. Detect alerts
        3. Send critical alerts via email
        4. Return report

        Run this on a schedule (e.g., every hour) alongside settlement processor.
        """
        try:
            # Collect metrics
            metrics = await SettlementMonitoring.get_system_metrics(db)
            logger.info(
                f"Settlement metrics: "
                f"pending={metrics.total_pending}, "
                f"in_progress={metrics.total_in_progress}, "
                f"overdue={metrics.total_overdue}, "
                f"failed={metrics.total_failed}"
            )

            # Detect alerts
            alerts = await SettlementMonitoring.detect_alerts(db)
            if alerts:
                logger.warning(f"Detected {len(alerts)} settlement alerts")
                for alert in alerts:
                    logger.warning(
                        f"[{alert.severity}] {alert.batch_reference}: {alert.message}"
                    )

                # Send critical alerts
                await SettlementMonitoring.send_alert_emails(db, alerts)

            return {
                "success": True,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "metrics": metrics,
                "alert_count": len(alerts),
                "critical_alerts": len([a for a in alerts if a.severity == "CRITICAL"]),
                "error_alerts": len([a for a in alerts if a.severity == "ERROR"]),
                "warning_alerts": len([a for a in alerts if a.severity == "WARNING"]),
            }

        except Exception as e:
            logger.error(f"Error in settlement monitoring cycle: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

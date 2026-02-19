import { ToggleGroup } from '../common/ToggleGroup';
import type { ToggleOption } from '../common/ToggleGroup';
import { useIntroducerStore } from '../../stores/useIntroducerStore';
import type { ContentDepth } from '../../stores/useIntroducerStore';
import { DEPTH_LEVELS, SECTION_DEPTH_MAP } from './constants';

export function ContentDepthSelector() {
  const { contentDepth, setContentDepth, dashboardTab } = useIntroducerStore();
  const availableLevels = SECTION_DEPTH_MAP[dashboardTab] ?? ['essential'];

  const options: ToggleOption[] = DEPTH_LEVELS.map((d) => ({
    value: d.id,
    label: d.label,
    disabled: !availableLevels.includes(d.id),
  }));

  return (
    <ToggleGroup
      options={options}
      value={contentDepth}
      onChange={(v) => setContentDepth(v as ContentDepth)}
      size="sm"
    />
  );
}

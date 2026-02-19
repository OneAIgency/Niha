import { useState, useEffect } from 'react';
import { Key, Brain, Database, MessageSquare, RefreshCw, Save, Trash2, Upload, ExternalLink } from 'lucide-react';
import { Button, Card, Badge, AlertBanner } from '../common';
import { aiAgentApi } from '../../services/api';

type SubTab = 'keys' | 'config' | 'knowledge' | 'test';

const SUB_TABS: { key: SubTab; label: string; icon: typeof Key }[] = [
  { key: 'keys', label: 'API Keys', icon: Key },
  { key: 'config', label: 'Agent Config', icon: Brain },
  { key: 'knowledge', label: 'Knowledge Base', icon: Database },
  { key: 'test', label: 'Test Console', icon: MessageSquare },
];

export function AIAgentTab() {
  const [subTab, setSubTab] = useState<SubTab>('keys');
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 mb-6">
        {SUB_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              subTab === key
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-navy-300 hover:bg-navy-700 border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} className="mb-4" />
      )}

      {subTab === 'keys' && <APIKeysSection onError={setError} />}
      {subTab === 'config' && <AgentConfigSection onError={setError} />}
      {subTab === 'knowledge' && <KnowledgeBaseSection onError={setError} />}
      {subTab === 'test' && <TestConsoleSection onError={setError} />}
    </div>
  );
}

// -- API Keys Sub-tab -----------------------------------------------------
function APIKeysSection({ onError }: { onError: (msg: string) => void }) {
  const [keys, setKeys] = useState<{ anthropicKeyMasked: string; openaiKeyMasked: string; anthropicUseEnv: boolean; openaiUseEnv: boolean } | null>(null);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    try {
      const data = await aiAgentApi.getApiKeys();
      setKeys(data);
    } catch (e) { onError((e as Error).message); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const update: Record<string, string> = {};
      if (anthropicKey) update.anthropic_api_key = anthropicKey;
      if (openaiKey) update.openai_api_key = openaiKey;
      await aiAgentApi.updateApiKeys(update);
      setAnthropicKey('');
      setOpenaiKey('');
      await loadKeys();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { onError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Key className="w-4 h-4 text-amber-400" /> API Keys
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-300 mb-1">Anthropic (Claude) API Key</label>
          <div className="text-xs text-navy-500 mb-1">
            Current: {keys?.anthropicKeyMasked || 'Not set'}
            {keys?.anthropicUseEnv && <Badge variant="info" className="ml-2 text-[10px]">From ENV</Badge>}
          </div>
          <input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)}
            className="w-full form-input" placeholder="sk-ant-..." autoComplete="off" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-300 mb-1">OpenAI (Embeddings) API Key</label>
          <div className="text-xs text-navy-500 mb-1">
            Current: {keys?.openaiKeyMasked || 'Not set'}
            {keys?.openaiUseEnv && <Badge variant="info" className="ml-2 text-[10px]">From ENV</Badge>}
          </div>
          <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)}
            className="w-full form-input" placeholder="sk-..." autoComplete="off" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>
            Save Keys
          </Button>
          {saved && <span className="text-sm text-emerald-400">Saved</span>}
        </div>
      </div>
    </Card>
  );
}

// -- Agent Config Sub-tab -------------------------------------------------
function AgentConfigSection({ onError }: { onError: (msg: string) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('INTRODUCER');
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    model: '', systemPrompt: '', temperature: 0.7, maxTokens: 4096,
    allowInternet: false, allowOffKnowledge: false, enabled: true,
  });

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    try {
      const data = await aiAgentApi.getConfigs();
      setConfigs(data);
      const current = data.find((c: { role: string }) => c.role === selectedRole);
      if (current) syncForm(current);
    } catch (e) { onError((e as Error).message); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const syncForm = (c: any) => {
    setEditForm({
      model: c.model, systemPrompt: c.systemPrompt, temperature: c.temperature,
      maxTokens: c.maxTokens, allowInternet: c.allowInternet,
      allowOffKnowledge: c.allowOffKnowledge, enabled: c.enabled,
    });
  };

  useEffect(() => {
    const current = configs.find((c: { role: string }) => c.role === selectedRole);
    if (current) syncForm(current);
  }, [selectedRole, configs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await aiAgentApi.updateConfig(selectedRole, {
        model: editForm.model,
        system_prompt: editForm.systemPrompt,
        temperature: editForm.temperature,
        max_tokens: editForm.maxTokens,
        allow_internet: editForm.allowInternet,
        allow_off_knowledge: editForm.allowOffKnowledge,
        enabled: editForm.enabled,
      });
      await loadConfigs();
    } catch (e) { onError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Brain className="w-4 h-4 text-emerald-400" /> Agent Configuration
      </h3>

      {/* Role selector */}
      <div className="flex items-center gap-2 mb-4">
        {['INTRODUCER', 'ADMIN'].map(role => (
          <button key={role} onClick={() => setSelectedRole(role)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedRole === role ? 'bg-emerald-500 text-white' : 'bg-navy-700 text-navy-300 hover:bg-navy-600'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-navy-300">
            <input type="checkbox" checked={editForm.enabled} onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
              className="rounded border-navy-600 text-emerald-600 focus:ring-emerald-500" />
            Agent Enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-300">
            <input type="checkbox" checked={editForm.allowInternet} onChange={(e) => setEditForm({ ...editForm, allowInternet: e.target.checked })}
              className="rounded border-navy-600 text-emerald-600 focus:ring-emerald-500" />
            Allow Internet
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-300">
            <input type="checkbox" checked={editForm.allowOffKnowledge} onChange={(e) => setEditForm({ ...editForm, allowOffKnowledge: e.target.checked })}
              className="rounded border-navy-600 text-emerald-600 focus:ring-emerald-500" />
            Allow Off-Knowledge
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1">Model</label>
            <input type="text" value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
              className="w-full form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1">Temperature ({editForm.temperature})</label>
            <input type="range" min="0" max="2" step="0.1" value={editForm.temperature}
              onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
              className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-300 mb-1">Max Tokens</label>
            <input type="number" value={editForm.maxTokens} onChange={(e) => setEditForm({ ...editForm, maxTokens: parseInt(e.target.value) || 4096 })}
              className="w-full form-input" min={256} max={8192} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-300 mb-1">System Prompt</label>
          <textarea value={editForm.systemPrompt} onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
            className="w-full form-input min-h-[200px] font-mono text-xs" rows={12} />
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>
          Save Config
        </Button>
      </div>
    </Card>
  );
}

// -- Knowledge Base Sub-tab -----------------------------------------------
function KnowledgeBaseSection({ onError }: { onError: (msg: string) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [urlName, setUrlName] = useState('');
  const [urlValue, setUrlValue] = useState('');

  useEffect(() => { loadSources(); }, []);

  const loadSources = async () => {
    try { setSources(await aiAgentApi.getKnowledgeSources()); }
    catch (e) { onError((e as Error).message); }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName) return;
    try {
      await aiAgentApi.uploadKnowledgeFile(uploadName, uploadFile);
      setShowUpload(false);
      setUploadName('');
      setUploadFile(null);
      await loadSources();
    } catch (e) { onError((e as Error).message); }
  };

  const handleAddUrl = async () => {
    if (!urlName || !urlValue) return;
    try {
      await aiAgentApi.addKnowledgeURL(urlName, urlValue);
      setShowAddUrl(false);
      setUrlName('');
      setUrlValue('');
      await loadSources();
    } catch (e) { onError((e as Error).message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge source and all its chunks?')) return;
    try { await aiAgentApi.deleteKnowledgeSource(id); await loadSources(); }
    catch (e) { onError((e as Error).message); }
  };

  const handleReindex = async (id: string) => {
    try { await aiAgentApi.reindexSource(id); await loadSources(); }
    catch (e) { onError((e as Error).message); }
  };

  const statusVariant = (s: string): 'success' | 'info' | 'danger' | 'default' => {
    switch (s) {
      case 'indexed': return 'success';
      case 'indexing': case 'pending': return 'info';
      case 'error': return 'danger';
      default: return 'default';
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" /> Knowledge Base
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowUpload(true)} icon={<Upload className="w-3.5 h-3.5" />}>Upload PDF</Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddUrl(true)} icon={<ExternalLink className="w-3.5 h-3.5" />}>Add URL</Button>
        </div>
      </div>

      {/* Sources table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-navy-700">
            <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-400 uppercase">Name</th>
            <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-400 uppercase">Type</th>
            <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-400 uppercase">Chunks</th>
            <th className="text-left py-2 px-2 text-[10px] font-medium text-navy-400 uppercase">Status</th>
            <th className="text-right py-2 px-2 text-[10px] font-medium text-navy-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-700">
          {sources.length === 0 && (
            <tr><td colSpan={5} className="py-8 text-center text-navy-400 text-sm">No knowledge sources yet.</td></tr>
          )}
          {sources.map((s: { id: string; name: string; sourceType: string; chunkCount: number; status: string }) => (
            <tr key={s.id} className="hover:bg-navy-800/50">
              <td className="py-2 px-2 text-sm text-white">{s.name}</td>
              <td className="py-2 px-2"><Badge variant="info" className="text-[10px]">{s.sourceType}</Badge></td>
              <td className="py-2 px-2 text-sm text-navy-300">{s.chunkCount}</td>
              <td className="py-2 px-2"><Badge variant={statusVariant(s.status)} className="text-[10px]">{s.status}</Badge></td>
              <td className="py-2 px-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => handleReindex(s.id)} className="p-1 rounded hover:bg-navy-700 text-navy-400 hover:text-white" title="Reindex">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1 rounded hover:bg-red-900/30 text-navy-400 hover:text-red-400" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Upload Knowledge File</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">Name</label>
                <input type="text" value={uploadName} onChange={(e) => setUploadName(e.target.value)} className="w-full form-input" placeholder="e.g., NIHA Platform Guide" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">File (PDF, TXT, MD)</label>
                <input type="file" accept=".pdf,.txt,.md" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="w-full text-sm text-navy-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowUpload(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleUpload} disabled={!uploadName || !uploadFile} className="flex-1">Upload</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add URL Modal */}
      {showAddUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Add URL Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">Name</label>
                <input type="text" value={urlName} onChange={(e) => setUrlName(e.target.value)} className="w-full form-input" placeholder="e.g., EU ETS Docs" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-300 mb-1">URL</label>
                <input type="url" value={urlValue} onChange={(e) => setUrlValue(e.target.value)} className="w-full form-input" placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddUrl(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleAddUrl} disabled={!urlName || !urlValue} className="flex-1">Add</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// -- Test Console Sub-tab -------------------------------------------------
function TestConsoleSection({ onError }: { onError: (msg: string) => void }) {
  const [mode, setMode] = useState<'single' | 'dual'>('single');
  const [role, setRole] = useState('INTRODUCER');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dualResult, setDualResult] = useState<{ introducer: { response: string }; admin: { response: string } } | null>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setDualResult(null);

    try {
      if (mode === 'dual') {
        const result = await aiAgentApi.dualChat(newMessages);
        setDualResult(result);
      } else {
        const result = await aiAgentApi.testChat(newMessages, role);
        setMessages([...newMessages, { role: 'assistant', content: result.response }]);
      }
    } catch (e) { onError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-emerald-400" /> Test Console
      </h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          {(['single', 'dual'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMessages([]); setDualResult(null); }}
              className={`px-3 py-1 rounded text-xs font-medium ${mode === m ? 'bg-emerald-500/20 text-emerald-400' : 'bg-navy-700 text-navy-300'}`}
            >
              {m === 'single' ? 'Single Role' : 'Dual Comparison'}
            </button>
          ))}
        </div>
        {mode === 'single' && (
          <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select text-xs w-40">
            <option value="INTRODUCER">INTRODUCER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        )}
      </div>

      {/* Chat messages */}
      <div className="bg-navy-900/50 rounded-lg border border-navy-700 min-h-[300px] max-h-[400px] overflow-y-auto p-4 space-y-3 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
            <div className={`inline-block rounded-lg p-3 max-w-[80%] text-sm ${
              msg.role === 'user' ? 'bg-emerald-500/10 text-navy-100' : 'bg-navy-800 text-navy-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {dualResult && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-navy-600 p-3">
              <div className="text-[10px] font-medium text-emerald-400 mb-2">INTRODUCER</div>
              <div className="text-sm text-navy-200 whitespace-pre-wrap">{dualResult.introducer.response}</div>
            </div>
            <div className="rounded-lg border border-navy-600 p-3">
              <div className="text-[10px] font-medium text-amber-400 mb-2">ADMIN</div>
              <div className="text-sm text-navy-200 whitespace-pre-wrap">{dualResult.admin.response}</div>
            </div>
          </div>
        )}
        {loading && <div className="flex items-center gap-2 text-navy-400"><RefreshCw className="w-4 h-4 animate-spin" /> Thinking...</div>}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 form-input" placeholder="Type a test message..." disabled={loading} />
        <Button variant="primary" size="sm" onClick={handleSend} disabled={loading || !input.trim()}>Send</Button>
      </div>
    </Card>
  );
}

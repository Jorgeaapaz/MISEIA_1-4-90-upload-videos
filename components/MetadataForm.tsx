'use client';

interface MetadataFormProps {
  metadata: Record<string, string>;
  onChange: (metadata: Record<string, string>) => void;
}

export default function MetadataForm({ metadata, onChange }: MetadataFormProps) {
  const entries = Object.entries(metadata);

  const addEntry = () => {
    onChange({ ...metadata, '': '' });
  };

  const updateKey = (oldKey: string, newKey: string, index: number) => {
    const newMeta: Record<string, string> = {};
    Object.entries(metadata).forEach(([k, v], i) => {
      newMeta[i === index ? newKey : k] = v;
    });
    onChange(newMeta);
  };

  const updateValue = (key: string, value: string) => {
    onChange({ ...metadata, [key]: value });
  };

  const removeEntry = (key: string) => {
    const copy = { ...metadata };
    delete copy[key];
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      {entries.map(([key, value], index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={key}
            onChange={e => updateKey(key, e.target.value, index)}
            placeholder="Clave"
            className="w-1/3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-500/50"
          />
          <input
            type="text"
            value={value}
            onChange={e => updateValue(key, e.target.value)}
            placeholder="Valor"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-500/50"
          />
          <button type="button" onClick={() => removeEntry(key)} className="text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="text-sm text-violet-400 hover:text-violet-300"
      >
        + Agregar campo
      </button>
    </div>
  );
}

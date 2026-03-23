import { useState, useEffect } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import ScreenShell from '../components/ScreenShell';
import ScreenHeader from '../components/ScreenHeader';
import { initLUTs, getAllCategoryNames, getCategoryLutCount } from '../engine/lutManager';
import { useCategoryPrefs } from '../hooks/useCategoryPrefs';
import { useWatermarkPref } from '../hooks/useWatermarkPref';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [lutsReady, setLutsReady] = useState(false);
  const { disabledCategories, toggleCategory, loaded } = useCategoryPrefs();
  const { watermarkEnabled, toggleWatermark } = useWatermarkPref();

  useEffect(() => {
    initLUTs().then(() => setLutsReady(true));
  }, []);

  const categories = lutsReady ? getAllCategoryNames() : [];

  return (
    <ScreenShell>
      <ScreenHeader
        left={
          <button onClick={() => navigate(-1)} className="text-accent">
            <ArrowLeft size={24} weight="bold" />
          </button>
        }
        center={<span className="text-sm font-medium tracking-wider">Settings</span>}
      />
      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <section className="mt-4 mb-6">
          <h2 className="text-[13px] tracking-widest text-muted mb-4">Watermark</h2>
          <button
            onClick={toggleWatermark}
            className="flex items-center justify-between w-full py-3 px-1 border-b border-white/5"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[13px] tracking-wider font-medium text-accent">
                Remove watermark
              </span>
              <span className="text-[10px] tracking-wider text-muted">
                Premium feature
              </span>
            </div>
            <div
              className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 ${
                !watermarkEnabled ? 'bg-amber-400' : 'bg-surface-lighter'
              }`}
            >
              <div
                className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  !watermarkEnabled ? 'translate-x-[21px]' : 'translate-x-[3px]'
                }`}
              />
            </div>
          </button>
        </section>

        <section>
          <h2 className="text-[13px] tracking-widest text-muted mb-4">Lut Packs</h2>

          {!lutsReady || !loaded ? (
            <p className="text-[11px] text-muted tracking-wider animate-pulse">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-[11px] text-muted tracking-wider">No LUT packs found</p>
          ) : (
            <div className="flex flex-col gap-1">
              {categories.map((cat) => {
                const enabled = !disabledCategories.has(cat);
                const count = getCategoryLutCount(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center justify-between py-3 px-1 border-b border-white/5"
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[13px] tracking-wider font-medium capitalize text-accent">
                        {cat}
                      </span>
                      <span className="text-[10px] tracking-wider text-muted">
                        {count} {count === 1 ? 'filter' : 'filters'}
                      </span>
                    </div>
                    <div
                      className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 ${
                        enabled ? 'bg-amber-400' : 'bg-surface-lighter'
                      }`}
                    >
                      <div
                        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                          enabled ? 'translate-x-[21px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </ScreenShell>
  );
}

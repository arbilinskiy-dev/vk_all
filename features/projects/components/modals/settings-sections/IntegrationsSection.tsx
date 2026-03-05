import React from 'react';
import { Project } from '../../../../../shared/types';
import { AccordionSection } from './AccordionSection';
import { AccordionSectionKey } from '../ProjectSettingsModal';
import { useIntegrationsSectionLogic } from '../../../hooks/useIntegrationsSectionLogic';
import { CallbackAutoSetupBlock } from './CallbackAutoSetupBlock';
import { CallbackCurrentStateBlock } from './CallbackCurrentStateBlock';
import { CallbackEventSelector } from './CallbackEventSelector';
import { CallbackSetupResult } from './CallbackSetupResult';
import { TokensBlock } from './TokensBlock';

interface IntegrationsSectionProps {
    formData: Project;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    isSaving: boolean;
    isTokenVisible: boolean;
    setIsTokenVisible: React.Dispatch<React.SetStateAction<boolean>>;
    additionalTokens: string[];
    handleAdditionalTokenChange: (index: number, value: string) => void;
    handleAddAdditionalToken: () => void;
    handleRemoveAdditionalToken: (index: number) => void;
    activeAccordion: AccordionSectionKey | null;
    handleAccordionToggle: (key: AccordionSectionKey) => void;
}

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
    formData,
    handleFormChange,
    isSaving,
    isTokenVisible,
    setIsTokenVisible,
    additionalTokens,
    handleAdditionalTokenChange,
    handleAddAdditionalToken,
    handleRemoveAdditionalToken,
    activeAccordion,
    handleAccordionToggle
}) => {
    const { state, actions } = useIntegrationsSectionLogic({
        formData, handleFormChange, isSaving, activeAccordion,
    });

    return (
        <AccordionSection title="Интеграции" sectionKey="integrations" activeSection={activeAccordion} onToggle={handleAccordionToggle}>
            <p className="text-sm text-gray-500 mb-2">Настройки для интеграции с внешними сервисами.</p>
            <div className="space-y-4">
                {/* Код подтверждения Callback API */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Код подтверждения Callback API</label>
                    <p className="text-xs text-gray-500 mb-2">Вставьте сюда строку, которую VK просит вернуть для подтверждения адреса сервера.</p>
                    <input
                        type="text"
                        name="vk_confirmation_code"
                        autoComplete="off"
                        value={formData.vk_confirmation_code || ''}
                        onChange={handleFormChange}
                        disabled={isSaving}
                        className="mt-1 w-full border rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        placeholder="Например, 'a1b2c3d4'"
                    />
                </div>

                {/* ─── Блок автонастройки Callback ──────────────────── */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                    <CallbackAutoSetupBlock
                        isLocal={state.isLocal}
                        tunnelMode={state.tunnelMode}
                        tunnelStatus={state.tunnelStatus}
                        isCheckingTunnel={state.isCheckingTunnel}
                        canAutoSetup={state.canAutoSetup}
                        isSettingUp={state.isSettingUp}
                        hasToken={state.hasToken}
                        hasGroupId={state.hasGroupId}
                        allSelected={state.allSelected}
                        selectedEventsCount={state.selectedEvents.size}
                        vkGroupShortName={formData.vkGroupShortName}
                        vkProjectId={formData.vkProjectId}
                        onAutoSetup={actions.handleAutoSetup}
                        onTunnelModeChange={actions.handleTunnelModeChange}
                        onCheckTunnel={actions.checkTunnelStatus}
                    />

                    {/* Текущее состояние callback-сервера из VK */}
                    {state.canAutoSetup && (
                        <CallbackCurrentStateBlock
                            currentState={state.currentState}
                            isLoadingCurrent={state.isLoadingCurrent}
                            loadCurrentError={state.loadCurrentError}
                            onLoadCurrentSettings={actions.loadCurrentSettings}
                        />
                    )}

                    {/* Выбор событий */}
                    <CallbackEventSelector
                        showEventSelector={state.showEventSelector}
                        onToggleSelector={actions.toggleEventSelector}
                        selectedEvents={state.selectedEvents}
                        onToggleEvent={actions.toggleEvent}
                        onToggleCategory={actions.toggleCategory}
                        onSelectAll={actions.selectAll}
                        onDeselectAll={actions.deselectAll}
                    />

                    {/* Результат автонастройки и ошибки */}
                    <CallbackSetupResult
                        setupResult={state.setupResult}
                        setupError={state.setupError}
                        vkGroupShortName={formData.vkGroupShortName}
                        vkProjectId={formData.vkProjectId}
                    />
                </div>

                {/* Токены сообщества */}
                <TokensBlock
                    formData={formData}
                    handleFormChange={handleFormChange}
                    isSaving={isSaving}
                    isTokenVisible={isTokenVisible}
                    setIsTokenVisible={setIsTokenVisible}
                    additionalTokens={additionalTokens}
                    handleAdditionalTokenChange={handleAdditionalTokenChange}
                    handleAddAdditionalToken={handleAddAdditionalToken}
                    handleRemoveAdditionalToken={handleRemoveAdditionalToken}
                />

                {/* ─── Интеграция DLVRY ──────────────────────────── */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-orange-800 mb-1">🍕 DLVRY — Заказы</h4>
                        <p className="text-xs text-orange-600 mb-3">
                            Привяжите филиал DLVRY к этому проекту, чтобы заказы автоматически попадали в систему.
                            Укажите ID филиала из панели DLVRY.
                        </p>
                    </div>

                    {/* Поле ID филиала */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ID филиала DLVRY</label>
                        <input
                            type="text"
                            name="dlvry_affiliate_id"
                            autoComplete="off"
                            value={formData.dlvry_affiliate_id || ''}
                            onChange={handleFormChange}
                            disabled={isSaving}
                            className="mt-1 w-full border rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                            placeholder="Например, 2579645"
                        />
                        {formData.dlvry_affiliate_id && (
                            <p className="text-xs text-green-600 mt-1">
                                ✓ Интеграция настроена — заказы из филиала {formData.dlvry_affiliate_id} будут привязаны к этому проекту
                            </p>
                        )}
                    </div>

                    {/* Инструкция по настройке вебхука */}
                    <div className="p-3 bg-white/70 border border-orange-200 rounded-lg">
                        <h5 className="text-xs font-semibold text-orange-800 mb-2">📋 Настройка вебхука в DLVRY</h5>
                        <p className="text-xs text-gray-600 mb-2">
                            Чтобы заказы автоматически поступали в систему, настройте вебхук в панели DLVRY:
                        </p>
                        <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside mb-3">
                            <li>
                                Откройте настройки филиала:{' '}
                                {formData.dlvry_affiliate_id ? (
                                    <a
                                        href={`https://panel.dlvry.ru/affiliates/${formData.dlvry_affiliate_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:text-orange-800 underline font-medium"
                                    >
                                        panel.dlvry.ru/affiliates/{formData.dlvry_affiliate_id}
                                    </a>
                                ) : (
                                    <span className="text-gray-400">panel.dlvry.ru/affiliates/<em>ID</em></span>
                                )}
                            </li>
                            <li>Перейдите в раздел <strong>«Внешние программы учёта»</strong></li>
                            <li>Выберите <strong>«Собственная CRM»</strong></li>
                            <li>
                                В поле URL вебхука укажите:
                            </li>
                        </ol>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 block bg-orange-50 border border-orange-300 rounded px-3 py-1.5 text-xs text-orange-900 font-mono select-all">
                                https://api.dosmmit.ru/api/dlvry/webhook
                            </code>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText('https://api.dosmmit.ru/api/dlvry/webhook');
                                }}
                                className="shrink-0 px-2 py-1.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded border border-orange-300 transition-colors"
                                title="Скопировать URL"
                            >
                                📋 Копировать
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                            После сохранения DLVRY будет отправлять данные о каждом новом заказе на этот адрес.
                        </p>
                    </div>
                </div>
            </div>
        </AccordionSection>
    );
};

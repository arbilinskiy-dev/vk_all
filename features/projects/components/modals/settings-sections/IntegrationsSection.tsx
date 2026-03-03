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
            </div>
        </AccordionSection>
    );
};

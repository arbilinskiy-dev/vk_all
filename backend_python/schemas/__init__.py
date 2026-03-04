
# Импортируем модули, чтобы избежать сложных проблем с зависимостями при инициализации
from . import base_models as base_models_module
from . import api_payloads as api_payloads_module
from . import api_responses as api_responses_module
from .models import admin_tools as admin_tools_module # Import new module
from pydantic import BaseModel
from typing import List

# "Экспортируем" все классы из модулей для обратной совместимости
# Это позволяет использовать `schemas.Project`, `schemas.GenerateTextPayload` и т.д.
PhotoAttachment = base_models_module.PhotoAttachment
Attachment = base_models_module.Attachment
TagBase = base_models_module.TagBase
TagCreate = base_models_module.TagCreate
TagUpdate = base_models_module.TagUpdate
Tag = base_models_module.Tag

# Схемы для шаблонов AI-инструкций
AiPromptPresetBase = base_models_module.AiPromptPresetBase
AiPromptPresetCreate = base_models_module.AiPromptPresetCreate
AiPromptPresetUpdate = base_models_module.AiPromptPresetUpdate
AiPromptPreset = base_models_module.AiPromptPreset

# Схемы для глобальных переменных
GlobalVariableDefinition = base_models_module.GlobalVariableDefinition
ProjectGlobalVariableValue = base_models_module.ProjectGlobalVariableValue

# Схемы для товаров
MarketAlbum = base_models_module.MarketAlbum
MarketItem = base_models_module.MarketItem
MarketPrice = base_models_module.MarketPrice
MarketCategory = base_models_module.MarketCategory

# Схемы для системных списков (НОВЫЕ)
SystemListSubscriber = base_models_module.SystemListSubscriber
SystemListMailingItem = base_models_module.SystemListMailingItem
SystemListHistoryItem = base_models_module.SystemListHistoryItem
SystemListPost = base_models_module.SystemListPost
SystemListInteraction = base_models_module.SystemListInteraction
SystemListAuthor = base_models_module.SystemListAuthor # NEW
ProjectListMeta = base_models_module.ProjectListMeta

# Схемы для системных аккаунтов
SystemAccount = base_models_module.SystemAccount

# Схемы для логов
TokenLog = base_models_module.TokenLog

# Схемы для контекста проектов
ProjectContextField = base_models_module.ProjectContextField
ProjectContextValue = base_models_module.ProjectContextValue

# Схемы для AI токенов
AiToken = base_models_module.AiToken
AiTokenLog = base_models_module.AiTokenLog
AiTokenVerifyResult = base_models_module.AiTokenVerifyResult
VerifyAiTokensResponse = base_models_module.VerifyAiTokensResponse

# NEW: Administered Group
AdministeredGroup = admin_tools_module.AdministeredGroup


PostBase = base_models_module.PostBase
ScheduledPost = base_models_module.ScheduledPost
SystemPost = base_models_module.SystemPost
SuggestedPost = base_models_module.SuggestedPost
Project = base_models_module.Project
Note = base_models_module.Note
Album = base_models_module.Album
Photo = base_models_module.Photo
Variable = base_models_module.Variable
User = base_models_module.User
UserResponse = base_models_module.UserResponse

ProjectIdPayload = api_payloads_module.ProjectIdPayload
ProjectIdsPayload = api_payloads_module.ProjectIdsPayload
UpdateProjectPayload = api_payloads_module.UpdateProjectPayload
SavePostPayload = api_payloads_module.SavePostPayload
PublishPostPayload = api_payloads_module.PublishPostPayload
DeletePostPayload = api_payloads_module.DeletePostPayload
CorrectTextPayload = api_payloads_module.CorrectTextPayload
SuggestedPostItem = api_payloads_module.SuggestedPostItem
BulkCorrectSuggestedPostsPayload = api_payloads_module.BulkCorrectSuggestedPostsPayload
AiVariablePayload = api_payloads_module.AiVariablePayload
GenerateTextPayload = api_payloads_module.GenerateTextPayload
GenerateBatchTextPayload = api_payloads_module.GenerateBatchTextPayload # Новый экспорт
ProcessTextPayload = api_payloads_module.ProcessTextPayload 
CreateAlbumPayload = api_payloads_module.CreateAlbumPayload
EditMarketAlbumPayload = api_payloads_module.EditMarketAlbumPayload
DeleteMarketAlbumPayload = api_payloads_module.DeleteMarketAlbumPayload
AlbumPayload = api_payloads_module.AlbumPayload
PhotosPayload = api_payloads_module.PhotosPayload
PinPostPayload = api_payloads_module.PinPostPayload
AlbumRefreshPayload = api_payloads_module.AlbumRefreshPayload
PhotosRefreshPayload = api_payloads_module.PhotosRefreshPayload
SaveNotePayload = api_payloads_module.SaveNotePayload
DeleteNotePayload = api_payloads_module.DeleteNotePayload
VkCallbackRequest = api_payloads_module.VkCallbackRequest
UpdateProjectsPayload = api_payloads_module.UpdateProjectsPayload
AddProjectsByUrlsPayload = api_payloads_module.AddProjectsByUrlsPayload
CreateTagPayload = api_payloads_module.CreateTagPayload
UpdateTagPayload = api_payloads_module.UpdateTagPayload
BulkRefreshPayload = api_payloads_module.BulkRefreshPayload # Новый экспорт

# Схемы для товаров
UpdateMarketItemPayload = api_payloads_module.UpdateMarketItemPayload
UpdateMarketItemsPayload = api_payloads_module.UpdateMarketItemsPayload
NewMarketItemPayload = api_payloads_module.NewMarketItemPayload
CreateMarketItemsPayload = api_payloads_module.CreateMarketItemsPayload
DeleteMarketItemsPayload = api_payloads_module.DeleteMarketItemsPayload

# Новая схема для AI подбора категории товара
SuggestMarketCategoryPayload = api_payloads_module.SuggestMarketCategoryPayload
# Новые схемы для массового подбора
SimpleMarketItem = api_payloads_module.SimpleMarketItem
BulkSuggestMarketCategoryPayload = api_payloads_module.BulkSuggestMarketCategoryPayload
# Новые схемы для массовой коррекции описаний
SimpleItemDescription = api_payloads_module.SimpleItemDescription

# Новые схемы для массовой коррекции описаний
BulkCorrectDescriptionsPayload = api_payloads_module.BulkCorrectDescriptionsPayload
SimpleItemDescription = api_payloads_module.SimpleItemDescription

# Новые схемы для массовой коррекции названий
SimpleItemTitle = api_payloads_module.SimpleItemTitle
BulkCorrectTitlesPayload = api_payloads_module.BulkCorrectTitlesPayload


# Схемы для шаблонов AI-инструкций
CreateAiPromptPresetPayload = api_payloads_module.CreateAiPromptPresetPayload
UpdateAiPromptPresetPayload = api_payloads_module.UpdateAiPromptPresetPayload

# Схемы для глобальных переменных
UpdateAllDefinitionsPayload = api_payloads_module.UpdateAllDefinitionsPayload
UpdateValuesForProjectPayload = api_payloads_module.UpdateValuesForProjectPayload

SystemPostIdPayload = api_payloads_module.SystemPostIdPayload
UpdateSystemPostPayload = api_payloads_module.UpdateSystemPostPayload
SimplePostIdPayload = api_payloads_module.SimplePostIdPayload
LoginPayload = api_payloads_module.LoginPayload
UpdateUsersPayload = api_payloads_module.UpdateUsersPayload

# Схемы для списков
SystemListPayload = api_payloads_module.SystemListPayload
AnalyzeMailingPayload = api_payloads_module.AnalyzeMailingPayload # NEW
RefreshInteractionsPayload = api_payloads_module.RefreshInteractionsPayload
RefreshPostsPayload = api_payloads_module.RefreshPostsPayload
RefreshAllPostsPayload = api_payloads_module.RefreshAllPostsPayload # Admin bulk operations
UserPostsPayload = api_payloads_module.UserPostsPayload # Посты пользователя (автора)

# Схемы для системных аккаунтов
AddSystemAccountsPayload = api_payloads_module.AddSystemAccountsPayload
UpdateSystemAccountPayload = api_payloads_module.UpdateSystemAccountPayload
DeleteSystemAccountPayload = api_payloads_module.DeleteSystemAccountPayload
VerifyTokenPayload = api_payloads_module.VerifyTokenPayload

# Схемы для логов и графиков
GetLogsPayload = api_payloads_module.GetLogsPayload
ClearLogsPayload = api_payloads_module.ClearLogsPayload
DeleteLogPayload = api_payloads_module.DeleteLogPayload
DeleteLogsBatchPayload = api_payloads_module.DeleteLogsBatchPayload
AccountChartPayload = api_payloads_module.AccountChartPayload
CompareStatsPayload = api_payloads_module.CompareStatsPayload

# Схемы для контекста проектов
CreateContextFieldPayload = api_payloads_module.CreateContextFieldPayload
UpdateContextFieldPayload = api_payloads_module.UpdateContextFieldPayload
UpdateContextValuesPayload = api_payloads_module.UpdateContextValuesPayload

# Схемы для AI токенов
UpdateAiTokensPayload = api_payloads_module.UpdateAiTokensPayload
DeleteAiTokenPayload = api_payloads_module.DeleteAiTokenPayload
GetAiLogsPayload = api_payloads_module.GetAiLogsPayload
ClearAiLogsPayload = api_payloads_module.ClearAiLogsPayload
DeleteAiLogPayload = api_payloads_module.DeleteAiLogPayload
DeleteAiLogsBatchPayload = api_payloads_module.DeleteAiLogsBatchPayload

# Схемы для назначения админов
PromoteToAdminsPayload = api_payloads_module.PromoteToAdminsPayload

InitialDataResponse = api_responses_module.InitialDataResponse
AllPostsForProjectsResponse = api_responses_module.AllPostsForProjectsResponse
ForceRefreshResponse = api_responses_module.ForceRefreshResponse
UpdateStatusResponse = api_responses_module.UpdateStatusResponse
VariablesResponse = api_responses_module.VariablesResponse
AiVariableSetupResponse = api_responses_module.AiVariableSetupResponse
AlbumResponse = api_responses_module.AlbumResponse
PhotosResponse = api_responses_module.PhotosResponse
GenericSuccess = api_responses_module.GenericSuccess
DeletePublishedPostResponse = api_responses_module.DeletePublishedPostResponse
CorrectedTextResponse = api_responses_module.CorrectedTextResponse
BulkCorrectedPostItem = api_responses_module.BulkCorrectedPostItem
BulkCorrectedSuggestedPostsResponse = api_responses_module.BulkCorrectedSuggestedPostsResponse
GeneratedTextResponse = api_responses_module.GeneratedTextResponse
GeneratedBatchTextResponse = api_responses_module.GeneratedBatchTextResponse # Новый экспорт
PostCountResponse = api_responses_module.PostCountResponse
AddProjectsByUrlsResponse = api_responses_module.AddProjectsByUrlsResponse
SyncAdministeredGroupsResponse = api_responses_module.SyncAdministeredGroupsResponse
LoginResponse = api_responses_module.LoginResponse

# Схемы для товаров
MarketDataResponse = api_responses_module.MarketDataResponse
BulkSuggestionResult = api_responses_module.BulkSuggestionResult
CorrectedDescriptionResult = api_responses_module.CorrectedDescriptionResult

# Схемы для автоматизаций
FinalizeContestResponse = api_responses_module.FinalizeContestResponse

# Схемы для глобальных переменных
GetGlobalVariablesForProjectResponse = api_responses_module.GetGlobalVariablesForProjectResponse
GetGlobalVariablesForMultipleProjectsResponse = api_responses_module.GetGlobalVariablesForMultipleProjectsResponse

# Схемы для списков (НОВЫЕ)
SystemListSubscribersResponse = api_responses_module.SystemListSubscribersResponse
SystemListMailingResponse = api_responses_module.SystemListMailingResponse
SystemListHistoryResponse = api_responses_module.SystemListHistoryResponse
SystemListPostsResponse = api_responses_module.SystemListPostsResponse
SystemListInteractionsResponse = api_responses_module.SystemListInteractionsResponse
SystemListAuthorsResponse = api_responses_module.SystemListAuthorsResponse # NEW
UserPostsResponse = api_responses_module.UserPostsResponse # Посты пользователя
SystemListMetaResponse = api_responses_module.SystemListMetaResponse
ListStatsResponse = api_responses_module.ListStatsResponse

# Схемы для задач (НОВЫЕ)
TaskStartResponse = api_responses_module.TaskStartResponse
TaskStatusResponse = api_responses_module.TaskStatusResponse
TaskListResponse = api_responses_module.TaskListResponse

# Схемы для системных аккаунтов
VerifyTokenResponse = api_responses_module.VerifyTokenResponse
GetLogsResponse = api_responses_module.GetLogsResponse

# Схемы для статистики логов и графиков
LogStatItem = api_responses_module.LogStatItem
AccountStatsResponse = api_responses_module.AccountStatsResponse
ChartDataPoint = api_responses_module.ChartDataPoint
AccountChartResponse = api_responses_module.AccountChartResponse
CompareStatsResponse = api_responses_module.CompareStatsResponse

# Схемы для контекста проектов
ProjectContextResponse = api_responses_module.ProjectContextResponse
ProjectSpecificContextResponse = api_responses_module.ProjectSpecificContextResponse

# Схемы для AI логов
GetAiLogsResponse = api_responses_module.GetAiLogsResponse
ScheduleRefreshResponse = api_responses_module.ScheduleRefreshResponse

# Схемы для назначения админов
PromoteUserResult = api_responses_module.PromoteUserResult
PromoteToAdminsResponse = api_responses_module.PromoteToAdminsResponse

# Схемы для массового редактирования постов
from . import bulk_edit as bulk_edit_module
BulkEditSearchRequest = bulk_edit_module.BulkEditSearchRequest
BulkEditSearchResponse = bulk_edit_module.BulkEditSearchResponse
BulkEditApplyRequest = bulk_edit_module.BulkEditApplyRequest
BulkEditApplyResponse = bulk_edit_module.BulkEditApplyResponse
BulkEditTaskStatus = bulk_edit_module.BulkEditTaskStatus
TaskProgress = bulk_edit_module.TaskProgress
TaskError = bulk_edit_module.TaskError
FoundPost = bulk_edit_module.FoundPost
PostToEdit = bulk_edit_module.PostToEdit
BulkEditChanges = bulk_edit_module.BulkEditChanges
SearchStats = bulk_edit_module.SearchStats
SourcePostInfo = bulk_edit_module.SourcePostInfo
MatchCriteria = bulk_edit_module.MatchCriteria
TargetPostTypes = bulk_edit_module.TargetPostTypes

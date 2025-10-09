import type { YospaceAdManagement } from './YospaceAdManagement';

export interface YospaceWindow extends Window {
    YospaceAdManagement: YospaceAdManagement;
}

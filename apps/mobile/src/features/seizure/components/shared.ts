/**
 * Ponte de componentes genéricos do módulo de Cefaleia para o de Convulsão.
 *
 * Card, ChipSelector, SectionHeader, WizardTitle, ListSelectItem e
 * SelectableList NÃO dependem de tipos específicos do headache (apenas do
 * tema `HT`, que tem a mesma paleta). Por isso, em vez de duplicá-los, os
 * re-exportamos para consumo local — mantendo uma única fonte de verdade.
 *
 * WizardHeader e WizardFooter foram criados localmente (o header do
 * headache tem o título "Registrar crise" hardcoded, mas é melhor manter
 * versão própria para futuras customizações). StepperNav também é local
 * porque depende de WIZARD_STEPS do config do seizure.
 */
export { Card } from '../../headache/components/Card';
export { ChipSelector, type ChipOption } from '../../headache/components/ChipSelector';
export { SectionHeader } from '../../headache/components/SectionHeader';
export { WizardTitle } from '../../headache/components/WizardTitle';
export { ListSelectItem } from '../../headache/components/ListSelectItem';
export { SelectableList } from '../../headache/components/SelectableList';

import {
  PanelRoot,
  PanelTrigger,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelBody,
  PanelFooter,
  type PanelSide,
} from "./_panel-shell";

/**
 * Sheet — painel lateral modal (trava foco, tem overlay, fecha ao clicar fora ou Esc).
 * Use para contexto/edição associada a um item sem sair da tela — perfil rápido de
 * cliente, detalhe de um agendamento aberto a partir da Agenda.
 */
export const Sheet = PanelRoot;
export const SheetTrigger = PanelTrigger;
export const SheetHeader = PanelHeader;
export const SheetTitle = PanelTitle;
export const SheetDescription = PanelDescription;
export const SheetBody = PanelBody;
export const SheetFooter = PanelFooter;

export function SheetContent(props: React.ComponentPropsWithoutRef<typeof PanelContent>) {
  return <PanelContent side={props.side ?? ("right" as PanelSide)} {...props} />;
}

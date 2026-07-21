import { PanelRoot, PanelTrigger, PanelContent, PanelHeader, PanelTitle, PanelBody, PanelFooter } from "./_panel-shell";

/**
 * SidePanel — mesmo shell visual do Sheet, mas não-modal: a página continua
 * interativa por trás dele (padrão "peek" do Linear/Notion — abrir detalhe de um
 * item sem perder contexto da lista). `modal={false}` é uma prop nativa do Radix
 * Dialog Root, não uma engine nossa.
 */
export function SidePanel(props: React.ComponentPropsWithoutRef<typeof PanelRoot>) {
  return <PanelRoot modal={false} {...props} />;
}
export const SidePanelTrigger = PanelTrigger;
export const SidePanelHeader = PanelHeader;
export const SidePanelTitle = PanelTitle;
export const SidePanelBody = PanelBody;
export const SidePanelFooter = PanelFooter;

export function SidePanelContent(props: React.ComponentPropsWithoutRef<typeof PanelContent>) {
  return <PanelContent showOverlay={false} {...props} />;
}

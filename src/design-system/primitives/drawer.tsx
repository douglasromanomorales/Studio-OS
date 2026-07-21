import { PanelRoot, PanelTrigger, PanelContent, PanelHeader, PanelTitle, PanelBody, PanelFooter } from "./_panel-shell";

/**
 * Drawer — mesmo shell do Sheet, preset para side="bottom". Pensado para mobile
 * (regra "Mobile Capable" do Design Language): confirmar agendamento, responder
 * orçamento, ações rápidas com o polegar, sem exigir navegação para outra tela.
 *
 * Escopo consciente desta versão: sem gesto de arrastar-para-fechar (swipe-to-dismiss).
 * Isso exigiria uma biblioteca de gestos dedicada (ex: vaul) — não construímos essa
 * engine agora porque nenhum módulo real ainda validou que o clique no X/overlay é
 * insuficiente. Se um módulo mobile-first futuro (Portal do Cliente) precisar do
 * gesto, é o gatilho certo para essa engine nascer.
 */
export const Drawer = PanelRoot;
export const DrawerTrigger = PanelTrigger;
export const DrawerHeader = PanelHeader;
export const DrawerTitle = PanelTitle;
export const DrawerBody = PanelBody;
export const DrawerFooter = PanelFooter;

export function DrawerContent(props: Omit<React.ComponentPropsWithoutRef<typeof PanelContent>, "side">) {
  return <PanelContent side="bottom" {...props} />;
}

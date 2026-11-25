/** Restore deep links originally shared from a project-hosted frontend. */
export function canonicalAppPath(pathname: string, base: string): string {
  const mount = base.replace(/\/$/, '');
  const project = /^\/([a-z\d-]+)frontend(?:\/(.*))?$/i.exec(pathname);
  if (!project) return pathname;

  const section = project[2] ?? '';
  const projectChat = section.replace(/\/$/, '').toLowerCase() === project[1].toLowerCase();
  return mount + '/' + (projectChat ? 'assistant' : section);
}

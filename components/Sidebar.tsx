import Link from 'next/link';

const items=[
  ['/','Dashboard'],
  ['/calendario','Calendário'],
  ['/conteudos','Conteúdos'],
  ['/ideias','Banco de Ideias'],
  ['/gerador-ideias','Gerador de Ideias'],
  ['/gerador-roteiros','Gerador de Roteiros'],
  ['/treinamento-ia','Treinamento IA']
];

export function Sidebar(){
  return <>
    <aside className="sidebar">
      <Link href="/" className="brand">
        <strong>Freire Educação</strong>
        <span>Gerador de conteúdo para redes sociais</span>
      </Link>

      <nav className="nav">
        {items.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}
      </nav>

      <div className="sidebar-footer">
        <span>1 ideia → vários ativos.</span>
        <span>Empresa como plataforma.</span>
      </div>
    </aside>

    <nav className="mobile-nav">
      {items.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}
    </nav>
  </>;
}

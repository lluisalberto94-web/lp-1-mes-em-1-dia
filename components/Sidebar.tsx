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
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand immersion-brand">
          <strong>Freire Educação</strong>
          <span>Content OS</span>
        </Link>

        <nav className="nav desktop-nav">
          {items.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}
        </nav>

        <div className="header-kicker">
          Conteúdo com estrutura
        </div>
      </div>
    </header>

    <nav className="mobile-nav">
      {items.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}
    </nav>
  </>;
}

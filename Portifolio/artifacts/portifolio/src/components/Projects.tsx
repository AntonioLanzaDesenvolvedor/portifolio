import { ProjectCard } from './ProjectCard';

export function Projects() {
  return (
    <section
      id="projects"
      className="py-24 bg-background border-t border-border/50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProjectCard
          title="Talentista"
          eyebrow="Front-end em produção"
          description="Interface desenvolvida para uma acessoria em recutamento e seleção focada em operação real, com visão clara do funil seletivo, acompanhamento por vaga, gestão de leads, execução semanal, contratos e módulos administrativos.
          Automatizando processos manuais e otimizando a experiência de clientes e hunters, o projeto é um case de sucesso que resultou em aumento de eficiência e satisfação dos usuários."
          highlights={[
            'Dashboard operacional com métricas, filtros e notificações',
            'Controle visual do funil de recrutamento por vaga',
            'Gestão de leads com status, motivos e organização por etapa',
            'Execução semanal para acompanhamento das hunters',
            'Fluxos de contratos e assinatura digital',
            'Módulos administrativos e financeiros integrados à experiência',
            'Área do cliente com visão geral e detalhes de cada vaga',
            'Relatórios sobre o processo seletivo',
            'Aplicação e correção de testes técnicos para candidatos',
          ]}
          tags={['React', 'MUI', 'Framer Motion', 'UX Operacional']}
          images={[
            { src: '/images/talentista/dashboard.png', alt: 'Dashboard operacional - Talentista' },
            { src: '/images/talentista/funnel.png', alt: 'Funil operacional por vaga' },
            { src: '/images/talentista/leads.png', alt: 'Gestão de leads (Hunting)' },
            { src: '/images/talentista/contracts.png', alt: 'Módulo de contratos' },
            { src: '/images/talentista/client.png', alt: 'Área do cliente' },
            { src: '/images/talentista/report.png', alt: 'Relatórios sobre o processo seletivo' },
          ]}
          projectUrl="https://talentista.com"
        />
      </div>
    </section>
  );
}
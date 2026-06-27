'use client'

import { useState } from 'react'
import AppLayout from '@cloudscape-design/components/app-layout'
import ContentLayout from '@cloudscape-design/components/content-layout'
import Flashbar, { FlashbarProps } from '@cloudscape-design/components/flashbar'
import HelpPanel from '@cloudscape-design/components/help-panel'
import SideNavigation from '@cloudscape-design/components/side-navigation'
import SpaceBetween from '@cloudscape-design/components/space-between'
import TopNavigation from '@cloudscape-design/components/top-navigation'
import { applyMode, Mode } from '@cloudscape-design/global-styles'

import { CaptureScreen } from '@/components/screens/capture-screen'
import { DashboardScreen } from '@/components/screens/dashboard-screen'
import { HistoryScreen } from '@/components/screens/history-screen'

export type Section = 'capturar' | 'inicio' | 'historial'

const HELP_BY_SECTION: Record<Section, { title: string; body: string[] }> = {
  capturar: {
    title: 'Capturar un gasto',
    body: [
      'Escribí o dictá tu gasto en lenguaje natural, por ejemplo: "70 mil en el super".',
      'Te mostramos una vista previa editable. Revisala, ajustá lo que haga falta y recién ahí guardás.',
      'Si no logramos interpretarlo, podés completar los datos a mano sin perder el ritmo.',
    ],
  },
  inicio: {
    title: 'Tu mes de un vistazo',
    body: [
      'El número grande es todo lo que llevás gastado este mes.',
      'Abajo ves cómo se reparte por categoría y tus últimos movimientos.',
    ],
  },
  historial: {
    title: 'Historial de gastos',
    body: [
      'Todos tus movimientos, del más nuevo al más viejo.',
      'Filtrá por categoría para enfocarte. El filtro por fecha llega más adelante.',
    ],
  },
}

export function AppFrame({ onSignOut }: { onSignOut: () => void }) {
  const [section, setSection] = useState<Section>('capturar')
  const [navigationOpen, setNavigationOpen] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [flashItems, setFlashItems] = useState<
    FlashbarProps.MessageDefinition[]
  >([])

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    applyMode(next ? Mode.Dark : Mode.Light)
  }

  function notifySaved(message: string) {
    const itemId = Math.random().toString(36).slice(2)
    setFlashItems([
      {
        id: itemId,
        type: 'success',
        dismissible: true,
        statusIconAriaLabel: 'Éxito',
        content: message,
        onDismiss: () =>
          setFlashItems((items) => items.filter((i) => i.id !== itemId)),
      },
    ])
  }

  const help = HELP_BY_SECTION[section]

  return (
    <>
      <div id="top-nav">
        <TopNavigation
          identity={{
            href: '#',
            title: 'Budgeting',
            logo: {
              src: `data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><rect width="30" height="30" rx="8" fill="#0f766e"/><path d="M9 20V10m0 0h7a3 3 0 0 1 0 6H9m0 0h8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
              )}`,
              alt: 'Budgeting',
            },
          }}
          utilities={[
            {
              type: 'button',
              iconName: darkMode ? 'star-filled' : 'star',
              text: darkMode ? 'Oscuro' : 'Claro',
              ariaLabel: 'Cambiar modo de color',
              onClick: toggleDarkMode,
            },
            {
              type: 'menu-dropdown',
              text: 'Vos',
              description: 'vos@budgeting.app',
              iconName: 'user-profile',
              items: [
                { id: 'perfil', text: 'Mi perfil' },
                { id: 'preferencias', text: 'Preferencias' },
                { id: 'signout', text: 'Cerrar sesión' },
              ],
              onItemClick: ({ detail }) => {
                if (detail.id === 'signout') onSignOut()
              },
            },
          ]}
          i18nStrings={{
            overflowMenuTriggerText: 'Más',
            overflowMenuTitleText: 'Todo',
          }}
        />
      </div>

      <AppLayout
        headerSelector="#top-nav"
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
        toolsOpen={toolsOpen}
        onToolsChange={({ detail }) => setToolsOpen(detail.open)}
        toolsWidth={320}
        navigation={
          <SideNavigation
            activeHref={`#/${section}`}
            header={{ href: '#/capturar', text: 'Budgeting' }}
            onFollow={(e) => {
              e.preventDefault()
              const next = e.detail.href.replace('#/', '') as Section
              setSection(next)
            }}
            items={[
              { type: 'link', text: 'Capturar gasto', href: '#/capturar' },
              { type: 'link', text: 'Inicio', href: '#/inicio' },
              { type: 'link', text: 'Historial', href: '#/historial' },
            ]}
          />
        }
        tools={
          <HelpPanel header={<h2>{help.title}</h2>}>
            <SpaceBetween size="m">
              {help.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </SpaceBetween>
          </HelpPanel>
        }
        notifications={<Flashbar items={flashItems} />}
        content={
          <ContentLayout>
            {section === 'capturar' && (
              <CaptureScreen
                onSaved={() => {
                  notifySaved('Gasto guardado. Lo vas a ver en tu historial.')
                  setSection('inicio')
                }}
                onOpenHelp={() => setToolsOpen(true)}
              />
            )}
            {section === 'inicio' && (
              <DashboardScreen
                onCapture={() => setSection('capturar')}
                onSeeHistory={() => setSection('historial')}
              />
            )}
            {section === 'historial' && (
              <HistoryScreen
                onUpdated={() => notifySaved('Gasto actualizado.')}
              />
            )}
          </ContentLayout>
        }
      />
    </>
  )
}

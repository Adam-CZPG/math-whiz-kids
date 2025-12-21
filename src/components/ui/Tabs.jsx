import React, { createContext, useContext, useState } from 'react'

const TabsContext = createContext()

export function Tabs({ defaultValue, children, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

export function TabsTrigger({ value, children, className = '' }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value
  
  const buttonClass = 'px-4 py-2 font-medium transition-colors ' + className
  
  return (
    <button
      className={buttonClass}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => setActiveTab(value)}
      style={isActive ? { backgroundColor: 'white', color: '#1f2937', borderRadius: '12px' } : {}}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = '' }) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null
  return <div className={className}>{children}</div>
}
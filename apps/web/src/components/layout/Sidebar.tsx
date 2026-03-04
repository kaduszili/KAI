import { NavLink, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Palette,
  Settings,
  Users,
  Shield,
  LogOut,
  Bird,
  UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  to:    string
  label: string
  icon:  React.ReactNode
  end?:  boolean
}

const customerNav: NavItem[] = [
  { to: '/dashboard',  label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
  { to: '/messages',   label: 'Messages',   icon: <MessageSquare  size={16} /> },
  { to: '/knowledge',  label: 'Knowledge',  icon: <BookOpen       size={16} /> },
  { to: '/appearance', label: 'Appearance', icon: <Palette        size={16} /> },
  { to: '/settings',   label: 'Settings',   icon: <Settings       size={16} /> },
]

const adminNav: NavItem[] = [
  { to: '/superadmin',        label: 'Overview', icon: <Shield size={16} />, end: true },
  { to: '/superadmin/users',  label: 'Users',    icon: <Users  size={16} /> },
]

function NavGroup({ items, label }: { items: NavItem[]; label?: string }) {
  return (
    <div className="mb-1">
      {label && (
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
      )}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
            )
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-slate-900 border-r border-slate-800 px-3 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600">
          <Bird size={15} className="text-white" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">Bentevi</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-4">
        <NavGroup items={customerNav} />

        {user?.role === 'super_admin' && (
          <NavGroup items={adminNav} label="Super Admin" />
        )}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-slate-800 pt-3 mt-3">
        <div className="px-3 mb-2">
          <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
            )
          }
        >
          <UserCircle size={16} />
          Profile
        </NavLink>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

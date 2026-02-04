'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Truck, 
  Wrench, 
  Plus, 
  Search,
  MoreVertical,
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/database.types';

type Section = 'dashboard' | 'workers' | 'projects' | 'vehicles' | 'equipment';

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [workers, setWorkers] = useState<Tables<'workers'>[]>([]);
  const [projects, setProjects] = useState<Tables<'projects'>[]>([]);
  const [vehicles, setVehicles] = useState<Tables<'vehicles'>[]>([]);
  const [equipment, setEquipment] = useState<Tables<'equipment'>[]>([]);
  const [allocations, setAllocations] = useState<Tables<'resource_allocations'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      setConnectionError(null);
      const [
        { data: workersData, error: workersError },
        { data: projectsData, error: projectsError },
        { data: vehiclesData, error: vehiclesError },
        { data: equipmentData, error: equipmentError },
        { data: allocationsData, error: allocationsError }
      ] = await Promise.all([
        supabase.from('workers').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('equipment').select('*').order('created_at', { ascending: false }),
        supabase.from('resource_allocations').select('*')
      ]);
      
      // Check for connection errors
      const errors = [workersError, projectsError, vehiclesError, equipmentError, allocationsError].filter(Boolean);
      if (errors.length > 0 && errors[0]?.message?.includes('Failed to fetch') || errors[0]?.message?.includes('Connection refused')) {
        setConnectionError('Cannot connect to Supabase. Please check your connection settings.');
      }
      
      if (workersData) setWorkers(workersData);
      if (projectsData) setProjects(projectsData);
      if (vehiclesData) setVehicles(vehiclesData);
      if (equipmentData) setEquipment(equipmentData);
      if (allocationsData) setAllocations(allocationsData);
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Connection refused')) {
        setConnectionError('Cannot connect to Supabase. Please check your connection settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription for all tables (only if connection is available)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          () => {
            fetchData();
          }
        )
        .subscribe();
    } catch (error) {
      // Silently fail if realtime subscription fails
      console.warn('Realtime subscription failed:', error);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const renderContent = () => {
    if (connectionError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
            <p className="text-sm text-red-700 mb-4">{connectionError}</p>
            <div className="text-xs text-red-600 space-y-2">
              <p><strong>To fix this:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>If using local Supabase: Start Docker and run <code className="bg-red-100 px-1 rounded">pnpm supabase start</code></li>
                <li>If using remote Supabase: Update <code className="bg-red-100 px-1 rounded">.env.local</code> with your project URL and anon key</li>
                <li>Get your keys from: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
              </ol>
            </div>
          </div>
        </div>
      );
    }
    if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading data...</div>;

    switch (activeSection) {
      case 'dashboard':
        return <DashboardView workers={workers} projects={projects} vehicles={vehicles} equipment={equipment} />;
      case 'workers':
        return <WorkersView workers={workers} onRefresh={fetchData} />;
      case 'projects':
        return <ProjectsView projects={projects} workers={workers} vehicles={vehicles} equipment={equipment} allocations={allocations} onRefresh={fetchData} />;
      case 'vehicles':
        return <VehiclesView vehicles={vehicles} onRefresh={fetchData} />;
      case 'equipment':
        return <EquipmentView equipment={equipment} onRefresh={fetchData} />;
      default:
        return <DashboardView workers={workers} projects={projects} vehicles={vehicles} equipment={equipment} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            <span>WorkFlow Pro</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
            active={activeSection === 'dashboard'} 
            onClick={() => setActiveSection('dashboard')} 
          />
          <NavItem 
            icon={<Users className="w-5 h-5" />} 
            label="Workers" 
            active={activeSection === 'workers'} 
            onClick={() => setActiveSection('workers')} 
          />
          <NavItem 
            icon={<Briefcase className="w-5 h-5" />} 
            label="Projects" 
            active={activeSection === 'projects'} 
            onClick={() => setActiveSection('projects')} 
          />
          <NavItem 
            icon={<Truck className="w-5 h-5" />} 
            label="Vehicles" 
            active={activeSection === 'vehicles'} 
            onClick={() => setActiveSection('vehicles')} 
          />
          <NavItem 
            icon={<Wrench className="w-5 h-5" />} 
            label="Equipment" 
            active={activeSection === 'equipment'} 
            onClick={() => setActiveSection('equipment')} 
          />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">John Doe</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">{activeSection}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DashboardView({ workers, projects, vehicles, equipment }: { 
  workers: Tables<'workers'>[], 
  projects: Tables<'projects'>[],
  vehicles: Tables<'vehicles'>[],
  equipment: Tables<'equipment'>[]
}) {
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const vehiclesInUse = vehicles.filter(v => v.status === 'in_use').length;
  const equipmentAvailable = equipment.length > 0 
    ? Math.round((equipment.filter(e => e.status === 'available').length / equipment.length) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Projects" value={activeProjects.toString()} icon={<Briefcase className="w-6 h-6" />} color="bg-blue-500" />
        <StatCard label="Total Workers" value={workers.length.toString()} icon={<Users className="w-6 h-6" />} color="bg-indigo-500" />
        <StatCard label="Vehicles in Use" value={`${vehiclesInUse}/${vehicles.length}`} icon={<Truck className="w-6 h-6" />} color="bg-emerald-500" />
        <StatCard label="Equipment Health" value={`${equipmentAvailable}%`} icon={<Wrench className="w-6 h-6" />} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Projects</h3>
          <div className="space-y-4">
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{project.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {project.location || 'No location'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium capitalize">{project.status?.replace('_', ' ')}</span>
              </div>
            ))}
            {projects.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No projects found.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Resource Allocation</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Personnel Utilization</span>
                <span className="text-sm font-bold text-slate-800">85%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Vehicle Availability</span>
                <span className="text-sm font-bold text-slate-800">66%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '66%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function WorkersView({ workers, onRefresh }: { workers: Tables<'workers'>[], onRefresh: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const supabase = createClient();

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('workers').insert([{ name, role, status: 'active' }]);
    if (!error) {
      setIsModalOpen(false);
      setName('');
      setRole('');
      onRefresh();
    }
  };

  const handleDeleteWorker = async (id: string) => {
    if (confirm('Are you sure you want to delete this worker?')) {
      await supabase.from('workers').delete().eq('id', id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Personnel Directory</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Worker
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xl font-bold mb-6">Add New Worker</h4>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <input 
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Site Supervisor"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                Save Worker
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Role</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workers.map((worker) => (
              <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {worker.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{worker.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{worker.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    worker.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {worker.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleDeleteWorker(worker.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No workers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectsView({ projects, workers, vehicles, equipment, allocations, onRefresh }: { 
  projects: Tables<'projects'>[], 
  workers: Tables<'workers'>[],
  vehicles: Tables<'vehicles'>[],
  equipment: Tables<'equipment'>[],
  allocations: Tables<'resource_allocations'>[],
  onRefresh: () => void 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  
  const [assignType, setAssignType] = useState<'worker' | 'vehicle' | 'equipment'>('worker');
  const [assignId, setAssignId] = useState('');

  const supabase = createClient();

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('projects').insert([{ name, location, status: 'planning' }]);
    if (!error) {
      setIsModalOpen(false);
      setName('');
      setLocation('');
      onRefresh();
    }
  };

  const handleAssignResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !assignId) return;

    const payload: any = { project_id: selectedProjectId };
    if (assignType === 'worker') payload.worker_id = assignId;
    if (assignType === 'vehicle') payload.vehicle_id = assignId;
    if (assignType === 'equipment') payload.equipment_id = assignId;

    const { error } = await supabase.from('resource_allocations').insert([payload]);
    
    if (!error) {
      // Update status of asset
      if (assignType === 'vehicle') await supabase.from('vehicles').update({ status: 'in_use' }).eq('id', assignId);
      if (assignType === 'equipment') await supabase.from('equipment').update({ status: 'in_use' }).eq('id', assignId);
      
      setIsAssignModalOpen(false);
      setAssignId('');
      onRefresh();
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await supabase.from('projects').delete().eq('id', id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Active Projects</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xl font-bold mb-6">Create New Project</h4>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Skyline Tower" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input required value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Downtown District" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">Create Project</button>
            </form>
          </div>
        </div>
      )}

      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsAssignModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xl font-bold mb-6">Assign Resource</h4>
            <form onSubmit={handleAssignResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resource Type</label>
                <select 
                  value={assignType} 
                  onChange={(e) => { setAssignType(e.target.value as any); setAssignId(''); }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="worker">Worker</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Resource</label>
                <select 
                  required
                  value={assignId} 
                  onChange={(e) => setAssignId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Choose...</option>
                  {assignType === 'worker' && workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.role})</option>)}
                  {assignType === 'vehicle' && vehicles.filter(v => v.status === 'available').map(v => <option key={v.id} value={v.id}>{v.name} - {v.license_plate}</option>)}
                  {assignType === 'equipment' && equipment.filter(e => e.status === 'available').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">Assign</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => {
          const projectAllocations = allocations.filter(a => a.project_id === project.id);
          const workerCount = projectAllocations.filter(a => a.worker_id).length;
          
          return (
            <div key={project.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedProjectId(project.id); setIsAssignModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Assign Resource"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">{project.name}</h4>
              <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {project.location || 'No location'}
              </p>
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Resources Assigned</span>
                  <span className="font-semibold text-slate-700">{projectAllocations.length}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex -space-x-2">
                    {projectAllocations.filter(a => a.worker_id).slice(0, 4).map((a, idx) => (
                      <div key={idx} className="w-7 h-7 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                        W
                      </div>
                    ))}
                    {workerCount > 4 && <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">+{workerCount - 4}</div>}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {project.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VehiclesView({ vehicles, onRefresh }: { vehicles: Tables<'vehicles'>[], onRefresh: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const supabase = createClient();

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('vehicles').insert([{ name, license_plate: plate, status: 'available' }]);
    if (!error) {
      setIsModalOpen(false);
      setName('');
      setPlate('');
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this vehicle?')) {
      await supabase.from('vehicles').delete().eq('id', id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Fleet Management</h3>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xl font-bold mb-6">Add New Vehicle</h4>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Ford F-150" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
                <input required value={plate} onChange={(e) => setPlate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="ABC-1234" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">Save Vehicle</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
            <button onClick={() => handleDelete(vehicle.id)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
            <div className="aspect-video bg-slate-100 rounded-xl mb-4 flex items-center justify-center text-slate-400">
              <Truck className="w-12 h-12" />
            </div>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-800">{vehicle.name}</h4>
              <span className={`w-2 h-2 rounded-full ${vehicle.status === 'available' ? 'bg-emerald-500' : vehicle.status === 'maintenance' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Plate: {vehicle.license_plate}</p>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">Status</span>
              <span className={`capitalize ${vehicle.status === 'available' ? 'text-emerald-600' : 'text-blue-600'}`}>
                {vehicle.status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EquipmentView({ equipment, onRefresh }: { equipment: Tables<'equipment'>[], onRefresh: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const supabase = createClient();

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('equipment').insert([{ name, serial_number: serial, status: 'available' }]);
    if (!error) {
      setIsModalOpen(false);
      setName('');
      setSerial('');
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this equipment?')) {
      await supabase.from('equipment').delete().eq('id', id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Equipment Inventory</h3>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Equipment
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xl font-bold mb-6">Add New Equipment</h4>
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Excavator" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                <input required value={serial} onChange={(e) => setSerial(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="SN-12345" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">Save Equipment</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-6 gap-6">
          {equipment.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 relative group">
              <button onClick={() => handleDelete(item.id)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-slate-800 text-sm">{item.name}</h5>
                <p className="text-xs text-slate-500">SN: {item.serial_number}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold capitalize ${item.status === 'available' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {item.status?.replace('_', ' ')}
                </p>
              </div>
            </div>
          ))}
          {equipment.length === 0 && <p className="col-span-full text-center py-8 text-slate-500">No equipment found.</p>}
        </div>
      </div>
    </div>
  );
}

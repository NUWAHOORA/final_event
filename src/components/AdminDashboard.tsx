import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { signOut, getCurrentUser } from "@/lib/auth";
import { Calendar, Users, Building2, LogOut, CheckCircle, XCircle, Clock } from "lucide-react";
import EventManagement from "@/components/EventManagement";
import UserManagement from "@/components/UserManagement";
import ResourceManagement from "@/components/ResourceManagement";
import PendingUsers from "@/components/PendingUsers";
import { NotificationBell } from "@/components/NotificationBell";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    pendingEvents: 0,
    totalUsers: 0,
    totalResources: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/auth');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const [eventsData, profilesData, resourcesData] = await Promise.all([
      supabase.from('events').select('id, status', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('resources').select('id', { count: 'exact' })
    ]);

    const pendingCount = eventsData.data?.filter(e => e.status === 'pending').length || 0;

    setStats({
      totalEvents: eventsData.count || 0,
      pendingEvents: pendingCount,
      totalUsers: profilesData.count || 0,
      totalResources: resourcesData.count || 0,
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out successfully" });
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--admin-bg))] to-[hsl(var(--admin-card))] text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--admin-primary))] to-[hsl(var(--admin-accent))] bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your university event system</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-[hsl(var(--admin-primary))] bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="w-4 h-4 text-[hsl(var(--admin-primary))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">All events in system</p>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--warning))] bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="w-4 h-4 text-[hsl(var(--warning))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingEvents}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--admin-accent))] bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-[hsl(var(--admin-accent))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--success))] bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <Building2 className="w-4 h-4 text-[hsl(var(--success))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResources}</div>
              <p className="text-xs text-muted-foreground">Venues & equipment</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="pending-users">Pending Users</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="events">
            <EventManagement role="admin" onStatsUpdate={fetchStats} />
          </TabsContent>
          
          <TabsContent value="pending-users">
            <PendingUsers />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="resources">
            <ResourceManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signOut, getCurrentUser } from "@/lib/auth";
import { Calendar, Users, LogOut, Plus } from "lucide-react";
import EventManagement from "@/components/EventManagement";
import { NotificationBell } from "@/components/NotificationBell";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [stats, setStats] = useState({
    myEvents: 0,
    totalParticipants: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    if (!user || user.role !== 'staff') {
      navigate('/auth');
      return;
    }
    setUserId(user.id);
    fetchStats(user.id);
    setLoading(false);
  };

  const fetchStats = async (staffId: string) => {
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('organizer_id', staffId);

    const eventIds = events?.map(e => e.id) || [];
    
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact' })
      .in('event_id', eventIds);

    setStats({
      myEvents: events?.length || 0,
      totalParticipants: count || 0,
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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--staff-bg))] to-[hsl(var(--staff-card))] text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--staff-primary))] to-[hsl(var(--staff-accent))] bg-clip-text text-transparent">
              Staff Dashboard
            </h1>
            <p className="text-muted-foreground">Create and manage your events</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-[hsl(var(--staff-primary))] bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Events</CardTitle>
              <Calendar className="w-4 h-4 text-[hsl(var(--staff-primary))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myEvents}</div>
              <p className="text-xs text-muted-foreground">Events you've created</p>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--staff-accent))] bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="w-4 h-4 text-[hsl(var(--staff-accent))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
              <p className="text-xs text-muted-foreground">Across all your events</p>
            </CardContent>
          </Card>
        </div>

        {/* Event Management */}
        <EventManagement role="staff" userId={userId} onStatsUpdate={() => fetchStats(userId)} />
      </div>
    </div>
  );
};

export default StaffDashboard;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { signOut, getCurrentUser } from "@/lib/auth";
import { Calendar, Clock, MapPin, LogOut, Users, CheckCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { NotificationBell } from "@/components/NotificationBell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string;
  category: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: string;
  resources_required: string | null;
}

interface Registration {
  event_id: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [venueId, setVenueId] = useState("");
  const [resourcesRequired, setResourcesRequired] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    if (!user || user.role !== 'student') {
      navigate('/auth');
      return;
    }
    setUserId(user.id);
    fetchEvents();
    fetchVenues();
    fetchRegistrations(user.id);
    fetchMyEvents(user.id);
    setLoading(false);
  };

  const fetchVenues = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('is_available', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching venues:', error);
      return;
    }
    setVenues(data || []);
  };

  const fetchEvents = async () => {
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (eventsData && eventsData.length > 0) {
      const venueIds = [...new Set(eventsData.map(event => event.venue_id).filter(Boolean))];
      const { data: venuesData } = await supabase
        .from('venues')
        .select('id, name, location')
        .in('id', venueIds);

      const venuesMap = new Map(venuesData?.map(v => [v.id, v]) || []);
      
      const eventsWithVenue = eventsData.map(event => ({
        ...event,
        venue: event.venue_id ? venuesMap.get(event.venue_id) : null
      }));
      
      setEvents(eventsWithVenue as any);
    } else {
      setEvents([]);
    }
  };

  const fetchRegistrations = async (studentId: string) => {
    const { data } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('student_id', studentId);

    setRegistrations(data || []);
  };

  const fetchMyEvents = async (studentId: string) => {
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', studentId)
      .order('created_at', { ascending: false });

    if (eventsData && eventsData.length > 0) {
      const venueIds = [...new Set(eventsData.map(event => event.venue_id).filter(Boolean))];
      const { data: venuesData } = await supabase
        .from('venues')
        .select('id, name, location')
        .in('id', venueIds);

      const venuesMap = new Map(venuesData?.map(v => [v.id, v]) || []);
      
      const eventsWithVenue = eventsData.map(event => ({
        ...event,
        venue: event.venue_id ? venuesMap.get(event.venue_id) : null
      }));
      
      setMyEvents(eventsWithVenue as any);
    } else {
      setMyEvents([]);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setVenueId("");
    setResourcesRequired("");
    setStartDate("");
    setEndDate("");
    setMaxParticipants("");
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      title,
      description,
      category,
      venue_id: venueId || null,
      resources_required: resourcesRequired || null,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      status: 'pending',
      organizer_id: userId,
    };

    const { error } = await supabase
      .from('events')
      .insert(eventData as any);

    if (error) {
      toast({ variant: "destructive", title: "Failed to create event", description: error.message });
      return;
    }

    toast({ 
      title: "Event created successfully!", 
      description: "Your event is pending approval from admin." 
    });

    setDialogOpen(false);
    resetForm();
    fetchMyEvents(userId);
  };

  const isRegistered = (eventId: string) => {
    return registrations.some(r => r.event_id === eventId);
  };

  const handleRegister = async (eventId: string) => {
    const { error } = await supabase
      .from('event_registrations')
      .insert({ event_id: eventId, student_id: userId });

    if (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Successfully registered!",
      description: "You're all set for this event.",
    });
    fetchRegistrations(userId);
  };

  const handleUnregister = async (eventId: string) => {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('student_id', userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to unregister",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Unregistered",
      description: "You've been removed from this event.",
    });
    fetchRegistrations(userId);
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

  const registeredEvents = events.filter(e => isRegistered(e.id));
  const availableEvents = events.filter(e => !isRegistered(e.id));

  return (
    <div className="min-h-screen bg-[hsl(var(--student-bg))] text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--student-primary))] to-[hsl(var(--student-accent))] bg-clip-text text-transparent">
              Student Dashboard
            </h1>
            <p className="text-muted-foreground">Browse and register for events</p>
          </div>
          <div className="flex gap-2">
            <NotificationBell />
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[hsl(var(--student-primary))] hover:bg-[hsl(var(--student-primary-light))]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your event. It will be sent for admin approval.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Workshop, Seminar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue *</Label>
                      <Select value={venueId} onValueChange={setVenueId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {venues.map((venue) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              {venue.name} {venue.location && `- ${venue.location}`}
                              {venue.capacity && ` (Capacity: ${venue.capacity})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resources">Resources Required</Label>
                    <Textarea
                      id="resources"
                      value={resourcesRequired}
                      onChange={(e) => setResourcesRequired(e.target.value)}
                      placeholder="e.g., Music instruments, Projector, 50 chairs, Tables, Microphone"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date & Time *</Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date & Time *</Label>
                      <Input
                        id="end-date"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-participants">Max Participants</Label>
                    <Input
                      id="max-participants"
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      min="1"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Event
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs for organized view */}
        <Tabs defaultValue="available" className="mt-4">
          <TabsList>
            <TabsTrigger value="available">Available Events</TabsTrigger>
            <TabsTrigger value="registered">My Registrations</TabsTrigger>
            <TabsTrigger value="my-events">My Created Events</TabsTrigger>
          </TabsList>

          {/* Available Events Tab */}
          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle>Available Events</CardTitle>
                <CardDescription>Browse and register for upcoming events</CardDescription>
              </CardHeader>
              <CardContent>
                {availableEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No available events at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableEvents.map((event) => (
                      <Card key={event.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          {event.category && (
                            <Badge variant="outline" className="w-fit mb-2">{event.category}</Badge>
                          )}
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.start_date), 'PPP')}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {format(new Date(event.start_date), 'p')}
                          </div>
                          {(event as any).venue && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <div>
                                <div>{(event as any).venue.name}</div>
                                {(event as any).venue.location && (
                                  <div className="text-xs">{(event as any).venue.location}</div>
                                )}
                              </div>
                            </div>
                          )}
                          {event.resources_required && (
                            <div className="text-xs text-muted-foreground">
                              Resources: {event.resources_required}
                            </div>
                          )}
                          <Button
                            className="w-full bg-[hsl(var(--student-primary))] hover:bg-[hsl(var(--student-primary-light))]"
                            onClick={() => handleRegister(event.id)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Register
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Registrations Tab */}
          <TabsContent value="registered">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-[hsl(var(--success))]" />
                  My Registered Events
                </CardTitle>
                <CardDescription>Events you have registered for</CardDescription>
              </CardHeader>
              <CardContent>
                {registeredEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>You haven't registered for any events yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registeredEvents.map((event) => (
                      <Card key={event.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <Badge className="bg-[hsl(var(--success))]">Registered</Badge>
                            {event.category && (
                              <Badge variant="outline">{event.category}</Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.start_date), 'PPP')}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {format(new Date(event.start_date), 'p')}
                          </div>
                          {(event as any).venue && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <div>
                                <div>{(event as any).venue.name}</div>
                                {(event as any).venue.location && (
                                  <div className="text-xs">{(event as any).venue.location}</div>
                                )}
                              </div>
                            </div>
                          )}
                          {event.resources_required && (
                            <div className="text-xs text-muted-foreground">
                              Resources: {event.resources_required}
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleUnregister(event.id)}
                          >
                            Unregister
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Created Events Tab */}
          <TabsContent value="my-events">
            <Card>
              <CardHeader>
                <CardTitle>My Created Events</CardTitle>
                <CardDescription>Events you have created and their approval status</CardDescription>
              </CardHeader>
              <CardContent>
                {myEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>You haven't created any events yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div>
                              <div className="font-semibold">{event.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {event.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{event.category || '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(event.start_date), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {(event as any).venue ? (
                                <>
                                  <div>{(event as any).venue.name}</div>
                                  {(event as any).venue.location && (
                                    <div className="text-xs text-muted-foreground">{(event as any).venue.location}</div>
                                  )}
                                </>
                              ) : (
                                'No venue'
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              event.status === 'approved' ? 'bg-[hsl(var(--success))]' :
                              event.status === 'rejected' ? 'bg-destructive' :
                              'bg-[hsl(var(--warning))]'
                            }>
                              {event.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
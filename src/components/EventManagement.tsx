import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  category: string | null;
  venue_id: string | null;
  resources_required: string | null;
  organizer_id: string;
  start_date: string;
  end_date: string;
  max_participants: number | null;
  status: string;
  profiles?: { full_name: string } | null;
}

interface EventManagementProps {
  role: 'admin' | 'staff';
  userId?: string;
  onStatsUpdate?: () => void;
}

const EventManagement = ({ role, userId, onStatsUpdate }: EventManagementProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
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
    fetchEvents();
    fetchVenues();
  }, [role, userId]);

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
    const query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: eventsData, error } = await query;
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    // Fetch organizer names and venue names separately
    if (eventsData && eventsData.length > 0) {
      const organizerIds = [...new Set(eventsData.map(event => event.organizer_id))];
      const venueIds = [...new Set(eventsData.map(event => event.venue_id).filter(Boolean))];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', organizerIds);

      const { data: venuesData } = await supabase
        .from('venues')
        .select('id, name, location')
        .in('id', venueIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);
      const venuesMap = new Map(venuesData?.map(v => [v.id, v]) || []);
      
      const eventsWithDetails = eventsData.map(event => ({
        ...event,
        organizer_name: profilesMap.get(event.organizer_id) || 'Unknown',
        venue: event.venue_id ? venuesMap.get(event.venue_id) : null
      }));
      
      setEvents(eventsWithDetails as any);
    } else {
      setEvents([]);
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
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    };

    if (editingEvent) {
      const { error } = await supabase
        .from('events')
        .update(eventData as any)
        .eq('id', editingEvent.id);

      if (error) {
        toast({ variant: "destructive", title: "Failed to update event", description: error.message });
        return;
      }
      toast({ title: "Event updated successfully" });
    } else {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { error } = await supabase
        .from('events')
        .insert({ ...eventData, organizer_id: session.session.user.id } as any);

      if (error) {
        toast({ variant: "destructive", title: "Failed to create event", description: error.message });
        return;
      }
      toast({ title: "Event created successfully", description: "Pending admin approval" });
    }

    setDialogOpen(false);
    resetForm();
    fetchEvents();
    onStatsUpdate?.();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || "");
    setCategory(event.category || "");
    setVenueId(event.venue_id || "");
    setResourcesRequired(event.resources_required || "");
    setStartDate(format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm"));
    setEndDate(format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm"));
    setMaxParticipants(event.max_participants?.toString() || "");
    setDialogOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast({ variant: "destructive", title: "Failed to delete event", description: error.message });
      return;
    }

    toast({ title: "Event deleted successfully" });
    fetchEvents();
    onStatsUpdate?.();
  };

  const handleApprove = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', eventId);

    if (error) {
      toast({ variant: "destructive", title: "Failed to approve event", description: error.message });
      return;
    }

    toast({ title: "Event approved" });
    fetchEvents();
    onStatsUpdate?.();
  };

  const handleReject = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status: 'rejected' })
      .eq('id', eventId);

    if (error) {
      toast({ variant: "destructive", title: "Failed to reject event", description: error.message });
      return;
    }

    toast({ title: "Event rejected" });
    fetchEvents();
    onStatsUpdate?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[hsl(var(--success))]';
      case 'rejected': return 'bg-destructive';
      case 'pending': return 'bg-[hsl(var(--warning))]';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? 'Update event details' : 'Fill in the details for your new event'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Tabs defaultValue="pending" className="mt-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="approved">All Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Events Awaiting Approval</CardTitle>
              <CardDescription>Review and approve or reject pending events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.filter(e => e.status === 'pending').map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-sm text-muted-foreground">{event.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>{(event as any).organizer_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {(event as any).venue?.name || 'No venue'}
                          {(event as any).venue?.location && (
                            <div className="text-xs text-muted-foreground">{(event as any).venue.location}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(event.start_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {role === 'admin' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(event.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(event.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(event)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {events.filter(e => e.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No pending events
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Approved events that haven't started yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {events.filter(e => e.status === 'approved' && new Date(e.start_date) > new Date()).map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{event.title}</CardTitle>
                          <CardDescription className="mt-2">{event.description}</CardDescription>
                        </div>
                        <Badge variant="default">Upcoming</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{format(new Date(event.start_date), 'PPP')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{format(new Date(event.start_date), 'p')} - {format(new Date(event.end_date), 'p')}</span>
                        </div>
                        {(event as any).venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{(event as any).venue.name}</span>
                            {(event as any).venue.location && <span className="text-muted-foreground">- {(event as any).venue.location}</span>}
                          </div>
                        )}
                        {event.resources_required && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Resources needed:</span> {event.resources_required}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Organizer:</span>
                          <span className="font-medium">{(event as any).organizer_name || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {role === 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {events.filter(e => e.status === 'approved' && new Date(e.start_date) > new Date()).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming events
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>All Approved Events</CardTitle>
              <CardDescription>All events that have been approved</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.filter(e => e.status === 'approved').map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-sm text-muted-foreground">{event.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>{(event as any).organizer_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(event.start_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {new Date(event.start_date) > new Date() ? 'Upcoming' : 'Past'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(event)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {events.filter(e => e.status === 'approved').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No approved events
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Events</CardTitle>
              <CardDescription>Events that were rejected by administrators</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.filter(e => e.status === 'rejected').map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-sm text-muted-foreground">{event.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>{(event as any).organizer_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(event.start_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {role === 'admin' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(event.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(event.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {events.filter(e => e.status === 'rejected').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No rejected events
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventManagement;
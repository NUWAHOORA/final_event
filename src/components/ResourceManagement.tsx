import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Building2, Wrench, Plus, Edit, Trash2 } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  type: string;
  description: string | null;
  capacity: number | null;
  is_available: boolean;
}

const ResourceManagement = () => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("music_instruments");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('name');

    setResources(data || []);
  };

  const resetForm = () => {
    setName("");
    setType("music_instruments");
    setDescription("");
    setCapacity("");
    setIsAvailable(true);
    setEditingResource(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resourceData = {
      name,
      type,
      description: description || null,
      capacity: capacity ? parseInt(capacity) : null,
      is_available: isAvailable,
    };

    if (editingResource) {
      const { error } = await supabase
        .from('resources')
        .update(resourceData as any)
        .eq('id', editingResource.id);

      if (error) {
        toast({ variant: "destructive", title: "Failed to update resource", description: error.message });
        return;
      }
      toast({ title: "Resource updated successfully" });
    } else {
      const { error } = await supabase
        .from('resources')
        .insert(resourceData as any);

      if (error) {
        toast({ variant: "destructive", title: "Failed to create resource", description: error.message });
        return;
      }
      toast({ title: "Resource created successfully" });
    }

    setDialogOpen(false);
    resetForm();
    fetchResources();
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setName(resource.name);
    setType(resource.type);
    setDescription(resource.description || "");
    setCapacity(resource.capacity?.toString() || "");
    setIsAvailable(resource.is_available);
    setDialogOpen(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) {
      toast({ variant: "destructive", title: "Failed to delete resource", description: error.message });
      return;
    }

    toast({ title: "Resource deleted successfully" });
    fetchResources();
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'music_instruments':
        return <Building2 className="w-5 h-5" />;
      case 'projector':
      case 'microphone':
      case 'speakers':
        return <Wrench className="w-5 h-5" />;
      default:
        return <Wrench className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resource Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
              <DialogDescription>
                {editingResource ? 'Update resource details' : 'Create a new venue or equipment'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Main Auditorium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music_instruments">Music Instruments</SelectItem>
                    <SelectItem value="projector">Projector</SelectItem>
                    <SelectItem value="chairs">Chairs</SelectItem>
                    <SelectItem value="tables">Tables</SelectItem>
                    <SelectItem value="microphone">Microphone</SelectItem>
                    <SelectItem value="speakers">Speakers</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Maximum capacity"
                  min="1"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Available</Label>
                <Switch
                  id="available"
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
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
                  {editingResource ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getTypeIcon(resource.type)}
                  <CardTitle className="text-lg">{resource.name}</CardTitle>
                </div>
                <Badge variant={resource.is_available ? "default" : "secondary"}>
                  {resource.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Type:</span> {resource.type === 'venue' ? 'Venue' : 'Equipment'}
                </p>
                {resource.capacity && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Capacity:</span> {resource.capacity}
                  </p>
                )}
                {resource.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {resource.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(resource)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(resource.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {resources.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No resources found. Add venues or equipment to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResourceManagement;
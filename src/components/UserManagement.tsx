import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, Building2, UserCog } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  user_roles?: { role: string }[];
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role)
      `)
      .order('full_name');

    setUsers((data as any) || []);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    // Delete existing role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', selectedUser.user_id);

    if (deleteError) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: deleteError.message,
      });
      return;
    }

    // Insert new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: selectedUser.user_id, role: newRole as any });

    if (insertError) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: insertError.message,
      });
      return;
    }

    toast({
      title: "Role updated successfully",
      description: `${selectedUser.full_name} is now a ${newRole}`,
    });

    setDialogOpen(false);
    setSelectedUser(null);
    setNewRole("");
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-[hsl(var(--admin-primary))]';
      case 'staff': return 'bg-[hsl(var(--staff-primary))]';
      case 'student': return 'bg-[hsl(var(--student-primary))]';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge className={getRoleBadgeColor('admin')}>Admin</Badge>
            <span>{users.filter(u => u.user_roles[0]?.role === 'admin').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getRoleBadgeColor('staff')}>Staff</Badge>
            <span>{users.filter(u => u.user_roles[0]?.role === 'staff').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getRoleBadgeColor('student')}>Student</Badge>
            <span>{users.filter(u => u.user_roles[0]?.role === 'student').length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{user.full_name}</CardTitle>
                </div>
                <Badge className={getRoleBadgeColor(user.user_roles[0]?.role)}>
                  {user.user_roles[0]?.role || 'No role'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.department && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  {user.department}
                </div>
              )}
              <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setSelectedUser(null);
                  setNewRole("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedUser(user);
                      setNewRole(user.user_roles[0]?.role || "");
                      setDialogOpen(true);
                    }}
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Change Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change User Role</DialogTitle>
                    <DialogDescription>
                      Update the role for {user.full_name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select New Role</label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleChangeRole}>
                        Update Role
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No users found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;
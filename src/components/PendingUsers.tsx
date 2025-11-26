import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Mail } from "lucide-react";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  created_at: string;
  user_roles: Array<{ role: string }>;
}

const PendingUsers = () => {
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, department, created_at")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for these users
      if (profilesData && profilesData.length > 0) {
        const userIds = profilesData.map(p => p.user_id);
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        if (rolesError) throw rolesError;

        // Combine data
        const usersWithRoles = profilesData.map(profile => ({
          ...profile,
          user_roles: rolesData?.filter(r => r.user_id === profile.user_id) || []
        }));

        setPendingUsers(usersWithRoles);
      } else {
        setPendingUsers([]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleApprove = async (user: PendingUser) => {
    setProcessingUserId(user.user_id);
    try {
      const tempPassword = generateTemporaryPassword();

      // Update user's password in auth.users
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.user_id,
        { password: tempPassword }
      );

      if (updateError) throw updateError;

      // Update is_approved status
      const { error: approveError } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("user_id", user.user_id);

      if (approveError) throw approveError;

      // Send approval email
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: {
          email: user.email,
          fullName: user.full_name,
          temporaryPassword: tempPassword,
        },
      });

      if (emailError) {
        console.error("Email sending failed:", emailError);
        toast({
          title: "User Approved",
          description: `${user.full_name} has been approved, but email notification failed. Temporary password: ${tempPassword}`,
        });
      } else {
        toast({
          title: "User Approved",
          description: `${user.full_name} has been approved and notified via email.`,
        });
      }

      fetchPendingUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleReject = async (user: PendingUser) => {
    setProcessingUserId(user.user_id);
    try {
      // Delete the user's profile and auth record
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user_id);

      if (deleteError) throw deleteError;

      toast({
        title: "User Rejected",
        description: `${user.full_name}'s account has been rejected and deleted.`,
      });

      fetchPendingUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "staff":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "student":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading pending users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending User Approvals</h2>
          <p className="text-muted-foreground">Review and approve new user registrations</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {pendingUsers.length} Pending
        </Badge>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No pending user approvals</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{user.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </CardDescription>
                  </div>
                  {user.user_roles && user.user_roles.length > 0 && (
                    <Badge className={getRoleBadgeColor(user.user_roles[0].role)}>
                      {user.user_roles[0].role}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.department && (
                  <p className="text-sm text-muted-foreground">
                    Department: {user.department}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Registered: {new Date(user.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleApprove(user)}
                    disabled={processingUserId === user.user_id}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {processingUserId === user.user_id ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReject(user)}
                    disabled={processingUserId === user.user_id}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingUsers;

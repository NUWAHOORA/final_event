import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp, getCurrentUser, UserRole } from "@/lib/auth";
import { GraduationCap, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ucuLogo from "@/assets/ucu-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole>("student");
  const [signupDepartment, setSignupDepartment] = useState("");

  useEffect(() => {
    // Listen for auth state changes to reliably redirect after login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer fetching role to avoid deadlocks per best practices
        setTimeout(async () => {
          const { user } = await getCurrentUser();
          if (user?.role) {
            redirectToDashboard(user.role);
          }
        }, 0);
      }
    });

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { user } = await getCurrentUser();
    if (user?.role) {
      redirectToDashboard(user.role);
    }
  };

  const redirectToDashboard = (role: UserRole) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'staff':
        navigate('/staff');
        break;
      case 'student':
        navigate('/student');
        break;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        return;
      }

      if (data.user) {
        const { user } = await getCurrentUser();
        
        if (user?.role) {
          toast({
            title: "Welcome back!",
            description: `Logged in as ${user.role}`,
          });
          redirectToDashboard(user.role);
        } else {
          toast({
            variant: "destructive",
            title: "Account not fully configured",
            description: "Your role is missing. Please try again in a moment or contact an admin.",
          });
        }
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(
        signupEmail,
        signupPassword,
        signupFullName,
        signupRole,
        signupDepartment
      );
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Account created!",
        description: "Your account is pending admin approval. You'll receive login details by email once approved.",
      });
      
      // Clear form and switch to login tab
      setSignupEmail("");
      setSignupPassword("");
      setSignupFullName("");
      setSignupDepartment("");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src={ucuLogo} alt="Uganda Christian University" className="h-20 w-auto mx-auto" />
          </div>
          <CardTitle className="text-3xl font-bold">University Events</CardTitle>
          <CardDescription>Manage and attend campus events</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your.email@university.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@university.edu"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select value={signupRole} onValueChange={(value) => setSignupRole(value as UserRole)}>
                    <SelectTrigger id="signup-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Student
                        </div>
                      </SelectItem>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Staff (Organizer)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-department">Department (Optional)</Label>
                  <Input
                    id="signup-department"
                    type="text"
                    placeholder="Computer Science"
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
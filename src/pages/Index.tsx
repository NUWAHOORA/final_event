import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { GraduationCap, Calendar, Users, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    if (user?.role) {
      switch (user.role) {
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6 animate-fade-in">
            <GraduationCap className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in">
            University Event Management
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            A comprehensive platform for organizing, managing, and participating in campus events
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="group animate-fade-in shadow-elegant"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 animate-fade-in border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-[hsl(var(--admin-primary))]/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[hsl(var(--admin-primary))]" />
              </div>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>
                Full control over events, users, and resources. Approve or reject events, manage user roles, and monitor system analytics.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 animate-fade-in border-[hsl(var(--staff-primary))]/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-[hsl(var(--staff-primary))]/10 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-[hsl(var(--staff-primary))]" />
              </div>
              <CardTitle>Staff Dashboard</CardTitle>
              <CardDescription>
                Create and manage your events effortlessly. Request resources, track participants, and gather feedback from attendees.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 animate-fade-in border-[hsl(var(--student-primary))]/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-[hsl(var(--student-primary))]/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[hsl(var(--student-primary))]" />
              </div>
              <CardTitle>Student Portal</CardTitle>
              <CardDescription>
                Browse upcoming events, register with one click, and manage your event schedule. Never miss an important campus event again.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Key Features */}
        <Card className="shadow-elegant animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">Key Features</CardTitle>
            <CardDescription>Everything you need for successful event management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Role-Based Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Secure authentication with distinct permissions for admins, staff, and students
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Event Approval Workflow</h3>
                  <p className="text-sm text-muted-foreground">
                    Staff create events that require admin approval before going live
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Resource Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage venues and equipment to prevent scheduling conflicts
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Easy Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Students can register for events with a single click
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Responsive Design</h3>
                  <p className="text-sm text-muted-foreground">
                    Beautiful, professional interface that works on all devices
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real-time Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Live updates on event status, registrations, and approvals
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join our university event management system today and streamline your campus events
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="shadow-elegant"
          >
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { setCredentials } from "@/store/slices/authSlice";
import { setColorMode } from "@/store/slices/themeSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import axios from "axios";

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/login",
        { email, password },
      );
      const { token, user } = response.data.data;
      dispatch(setCredentials({ token, user }));
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      {/* Theme toggle — top right */}
      <div className='fixed top-4 right-4'>
        <div className='fixed top-4 right-4'>
          <ThemeToggle />
        </div>
      </div>

      <div className='w-full max-w-md space-y-6'>
        {/* Brand */}
        <div className='text-center space-y-2'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground text-xl font-bold'>
            R
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Restaurant Manager
          </h1>
          <p className='text-muted-foreground text-sm'>
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='tamil@max.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete='email'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete='current-password'
                />
              </div>

              {error && (
                <div className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
                  {error}
                </div>
              )}

              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className='text-center text-xs text-muted-foreground'>
          Restaurant Management System v1.0
        </p>
      </div>
    </div>
  );
};

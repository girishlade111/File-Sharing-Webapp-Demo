import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabase/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Lock, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FileData {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  password_hash: string | null;
  expires_at: string;
}

export default function FileDownload() {
  const { fileId } = useParams<{ fileId: string }>();
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadFileData();
  }, [fileId]);

  const loadFileData = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) throw error;

      if (!data) {
        setError('File not found');
        return;
      }

      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        await supabase.storage.from('files').remove([data.file_path]);
        await supabase.from('files').delete().eq('id', fileId);
        setError('File has expired and been deleted');
        return;
      }

      setFileData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleDownload = async () => {
    if (!fileData) return;

    if (fileData.password_hash) {
      if (!password) {
        toast({
          title: 'Password Required',
          description: 'Please enter the password',
          variant: 'destructive',
        });
        return;
      }

      const hashedInput = await hashPassword(password);
      if (hashedInput !== fileData.password_hash) {
        toast({
          title: 'Incorrect Password',
          description: 'The password you entered is incorrect',
          variant: 'destructive',
        });
        return;
      }
    }

    setDownloading(true);

    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(fileData.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success!',
        description: 'File downloaded successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const getTimeRemaining = () => {
    if (!fileData) return '';
    const now = new Date();
    const expires = new Date(fileData.expires_at);
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Download File</CardTitle>
          <CardDescription>File is ready for download</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <p className="font-medium text-gray-900">{fileData?.filename}</p>
            <p className="text-sm text-gray-600">
              Size: {((fileData?.file_size || 0) / 1024 / 1024).toFixed(2)} MB
            </p>
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Clock className="h-4 w-4" />
              <span>Expires in: {getTimeRemaining()}</span>
            </div>
          </div>

          {fileData?.password_hash && (
            <div className="space-y-2">
              <Label htmlFor="password">Password Required</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={downloading}
                />
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download File'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
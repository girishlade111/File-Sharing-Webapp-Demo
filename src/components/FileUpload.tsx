import { useState } from 'react';
import { supabase } from '../../supabase/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Copy, Upload, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [expirationMinutes, setExpirationMinutes] = useState('5');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareLink, setShareLink] = useState('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileId = crypto.randomUUID();
      const filePath = `uploads/${fileId}/${file.name}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expirationMinutes));

      const passwordHash = password ? await hashPassword(password) : null;

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          password_hash: passwordHash,
          expires_at: expiresAt.toISOString(),
        });

      if (dbError) throw dbError;

      setUploadProgress(100);

      const link = `${window.location.origin}/download/${fileId}`;
      setShareLink(link);

      toast({
        title: 'Success!',
        description: 'File uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Copied!',
      description: 'Link copied to clipboard',
    });
  };

  const resetForm = () => {
    setFile(null);
    setPassword('');
    setExpirationMinutes('5');
    setShareLink('');
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">File Sharing</CardTitle>
          <CardDescription>Upload and share files securely with expiration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!shareLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <Upload className="h-5 w-5 text-gray-500" />
                </div>
                {file && (
                  <p className="text-sm text-gray-600">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Set password for protection"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={uploading}
                  />
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration Time</Label>
                <Select
                  value={expirationMinutes}
                  onValueChange={setExpirationMinutes}
                  disabled={uploading}
                >
                  <SelectTrigger id="expiration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="2">2 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Label>Upload Progress</Label>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload & Generate Link'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  File uploaded successfully!
                </p>
                <p className="text-xs text-green-600">
                  Expires in {expirationMinutes} minute(s)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly />
                  <Button onClick={copyToClipboard} size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={resetForm} variant="outline" className="w-full">
                Upload Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
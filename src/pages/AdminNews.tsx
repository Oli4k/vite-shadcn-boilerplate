import { useEffect, useState } from "react";
import type { News, CreateNewsData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface StandardResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminNews() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const result: StandardResponse<News[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch news');
      }
      
      setNews(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCreateNews = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newsData: CreateNewsData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      published: formData.get('published') === 'on',
    };

    try {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newsData),
      });

      const result: StandardResponse<News> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create news');
      }

      toast({
        title: "Success",
        description: "News article created successfully",
      });

      setIsDialogOpen(false);
      fetchNews();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create news',
      });
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ published: !currentStatus }),
      });

      const result: StandardResponse<News> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update news');
      }

      toast({
        title: "Success",
        description: `News article ${!currentStatus ? 'published' : 'unpublished'} successfully`,
      });

      fetchNews();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update news',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news article?')) {
      return;
    }

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result: StandardResponse<void> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete news');
      }

      toast({
        title: "Success",
        description: "News article deleted successfully",
      });

      fetchNews();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete news',
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create News</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create News Article</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNews} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  required
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="published" name="published" />
                <Label htmlFor="published">Publish immediately</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {news.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  By {item.author.name} • {format(new Date(item.createdAt), 'PPP')}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePublish(item.id, item.published)}
                >
                  {item.published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {item.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {news.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">No news articles available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
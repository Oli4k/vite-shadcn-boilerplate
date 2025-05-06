import { useEffect, useState } from "react";
import type { News } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface NewsResponse {
  success: boolean;
  data?: News[];
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function News() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news/public');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const result: NewsResponse = await response.json();
        
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

    fetchNews();
  }, []);

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
      {news.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  By {item.User?.name ?? "Unknown"} • {format(new Date(item.createdAt), 'PPP')}
                </p>
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
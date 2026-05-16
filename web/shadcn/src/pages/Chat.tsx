import { useStatus } from '@/hooks/use-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ExternalLink } from 'lucide-react';

export default function Chat() {
  const { status } = useStatus();
  const chatUrl = status?.chat_link;

  if (!chatUrl) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><MessageSquare className="h-6 w-6" /> 聊天</h1>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            聊天功能未配置
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><MessageSquare className="h-6 w-6" /> 聊天</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <iframe src={chatUrl} className="w-full h-[70vh] border-0 rounded-lg" title="Chat" />
        </CardContent>
      </Card>
    </div>
  );
}

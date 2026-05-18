import { Instagram, Facebook, Twitter } from 'lucide-react';
import { mockData } from './mockData';

export const SocialMediaModule = () => {
  const data = mockData.socialMedia;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-lato-bold text-foreground mb-4">KPIs de Redes Sociales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Instagram className="mx-auto text-pink-500 mb-2" size={32} />
            <p className="text-2xl font-lato-bold">{Intl.NumberFormat().format(data.instagram.followers)}</p>
            <p className="text-sm text-muted-foreground font-lato-light">Seguidores</p>
            <p className="text-sm text-green-500 font-lato-bold">+{data.instagram.change} esta semana</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <Facebook className="mx-auto text-blue-600 mb-2" size={32} />
            <p className="text-2xl font-lato-bold">{Intl.NumberFormat().format(data.facebook.followers)}</p>
            <p className="text-sm text-muted-foreground font-lato-light">Seguidores</p>
            <p className="text-sm text-green-500 font-lato-bold">+{data.facebook.change} esta semana</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <Twitter className="mx-auto text-foreground mb-2" size={32} />
            <p className="text-2xl font-lato-bold">{Intl.NumberFormat().format(data.tiktok.followers)}</p>
            <p className="text-sm text-muted-foreground font-lato-light">Seguidores</p>
            <p className="text-sm text-green-500 font-lato-bold">+{data.tiktok.change} esta semana</p>
          </div>
        </div>
      </div>
      <div className="bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-lato-bold text-foreground mb-4">Últimas Publicaciones</h3>
        <div className="space-y-4">
          {(data.recentPosts || []).map((post, i) => (
            <div key={i} className="flex items-center">
              {post.platform === 'instagram'
                ? <Instagram className="text-pink-500 mr-3" />
                : <Twitter className="text-foreground mr-3" />}
              <div>
                <p className="text-sm font-lato-bold">{post.content}</p>
                <p className="text-xs text-muted-foreground font-lato-light">Likes: {post.likes}, Comentarios: {post.comments}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

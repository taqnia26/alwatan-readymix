import { useLanguage } from '@/lib/i18n';
import { useListBranches } from '@workspace/api-client-react';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function Branches() {
  const { t, isRtl } = useLanguage();
  const { data: branches, isLoading } = useListBranches();
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedBranches = branches?.sort((a, b) => a.orderIndex - b.orderIndex) || [];
  
  // Set first branch as active by default if none selected
  if (sortedBranches.length > 0 && activeBranchId === null) {
    setActiveBranchId(sortedBranches[0].id);
  }

  const activeBranch = sortedBranches.find(b => b.id === activeBranchId) || sortedBranches[0];

  return (
    <div className="py-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-secondary mb-4">
            {t('فروعنا', 'Our Branches')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('شبكة واسعة من المصانع لتغطية كافة احتياجات مشاريعكم في المنطقة', 'A wide network of plants to cover all your project needs in the region')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Branch List */}
          <div className="space-y-4 lg:h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedBranches.map(branch => (
              <button
                key={branch.id}
                onClick={() => setActiveBranchId(branch.id)}
                className={`w-full text-start p-6 rounded-2xl border transition-all duration-300 ${
                  activeBranchId === branch.id 
                    ? 'bg-white border-primary shadow-lg shadow-primary/10 scale-[1.02]' 
                    : 'bg-white border-gray-100 shadow-sm hover:border-primary/30 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`font-bold text-lg ${activeBranchId === branch.id ? 'text-primary' : 'text-secondary'}`}>
                    {isRtl ? branch.nameAr : branch.nameEn}
                  </h3>
                  <div className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-500">
                    {branch.city}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span>{isRtl ? branch.addressAr : branch.addressEn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-mono" dir="ltr">{branch.phone}</span>
                  </div>
                </div>

                {activeBranchId === branch.id && (
                  <div className="mt-4 flex items-center text-primary text-sm font-bold gap-1">
                    <span>{t('عرض الخريطة', 'View Map')}</span>
                    <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Map Area */}
          <div className="lg:col-span-2">
            {activeBranch ? (
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden h-[600px] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-secondary mb-1">
                      {isRtl ? activeBranch.nameAr : activeBranch.nameEn}
                    </h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {activeBranch.workingHours}
                    </p>
                  </div>
                  <a 
                    href={(activeBranch as { googleMapsUrl?: string }).googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${activeBranch.lat},${activeBranch.lng}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    {t('الاتجاهات', 'Directions')}
                  </a>
                </div>
                <div className="flex-1 w-full h-full bg-gray-200 relative">
                  {/* Using OpenStreetMap Embed */}
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeBranch.lng - 0.05}%2C${activeBranch.lat - 0.05}%2C${activeBranch.lng + 0.05}%2C${activeBranch.lat + 0.05}&layer=mapnik&marker=${activeBranch.lat}%2C${activeBranch.lng}`}
                    className="absolute inset-0"
                    title={isRtl ? activeBranch.nameAr : activeBranch.nameEn}
                  ></iframe>
                </div>
              </div>
            ) : (
              <div className="h-[600px] bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400">
                {t('اختر فرعاً لعرض الخريطة', 'Select a branch to view the map')}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

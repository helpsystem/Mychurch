import React, { useState, useEffect } from 'react';
import { Star, Heart, Lock, User, Clock, MessageSquare, Filter, Search, RefreshCw, Calendar, MapPin, Eye, Share2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

interface Testimonial {
  id: string;
  type: 'testimony' | 'blessing' | 'confession';
  isAnonymous: boolean;
  testimonialText: string;
  name?: string;
  category: string;
  isPublic: boolean;
  dateOfEvent?: string;
  location?: string;
  rating: number;
  createdAt: string;
  likesCount: number;
  hasUserLiked: boolean;
  verificationStatus: 'pending' | 'verified' | 'not_required';
}

interface TestimonialsWallProps {
  className?: string;
  showOnlyPublic?: boolean;
  showAdminControls?: boolean;
}

const TestimonialsWall: React.FC<TestimonialsWallProps> = ({ 
  className = '', 
  showOnlyPublic = true,
  showAdminControls = false 
}) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'likes'>('newest');

  useEffect(() => {
    fetchTestimonials();
  }, [selectedCategory, selectedType, sortBy]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (showOnlyPublic) params.append('public', 'true');
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);
      params.append('sort', sortBy);
      
      const response = await fetch(`${window.location.origin.replace(':5000', ':3001')}/api/testimonials?${params.toString()}`, {
        headers: user && !showOnlyPublic ? {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }
      
      const data = await response.json();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setError('Failed to load testimonials');
      
      // Mock data for demonstration
      setTestimonials([
        {
          id: '1',
          type: 'testimony',
          isAnonymous: false,
          testimonialText: 'God completely healed my mother from cancer after months of prayer. The doctors were amazed by her recovery!',
          name: 'Maria S.',
          category: 'healing',
          isPublic: true,
          dateOfEvent: '2024-08-15',
          location: 'Washington, D.C.',
          rating: 5,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          likesCount: 24,
          hasUserLiked: false,
          verificationStatus: 'verified'
        },
        {
          id: '2',
          type: 'blessing',
          isAnonymous: true,
          testimonialText: 'I found a new job after being unemployed for 6 months. God provided exactly what my family needed!',
          category: 'provision',
          isPublic: true,
          rating: 4,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          likesCount: 18,
          hasUserLiked: true,
          verificationStatus: 'not_required'
        },
        {
          id: '3',
          type: 'confession',
          isAnonymous: false,
          testimonialText: 'I confess that Jesus Christ is my Lord and Savior. I accept Him into my heart today.',
          name: 'David R.',
          category: 'salvation',
          isPublic: true,
          rating: 5,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          likesCount: 42,
          hasUserLiked: false,
          verificationStatus: 'verified'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeTestimonial = async (testimonialId: string) => {
    try {
      const response = await fetch(`${window.location.origin.replace(':5000', ':3001')}/api/testimonials/${testimonialId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        }
      });
      
      if (response.ok) {
        // Update local state
        setTestimonials(prev => prev.map(testimonial => 
          testimonial.id === testimonialId 
            ? { 
                ...testimonial, 
                likesCount: testimonial.hasUserLiked ? testimonial.likesCount - 1 : testimonial.likesCount + 1,
                hasUserLiked: !testimonial.hasUserLiked 
              }
            : testimonial
        ));
      }
    } catch (error) {
      console.error('Error liking testimonial:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'healing': return '💊';
      case 'salvation': return '✝️';
      case 'provision': return '💰';
      case 'guidance': return '🧭';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'breakthrough': return '🚀';
      default: return '🙏';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      healing: lang === 'fa' ? 'شفا' : 'Healing',
      salvation: lang === 'fa' ? 'نجات' : 'Salvation',
      provision: lang === 'fa' ? 'تامین نیاز' : 'Provision',
      guidance: lang === 'fa' ? 'راهنمایی' : 'Guidance',
      family: lang === 'fa' ? 'خانواده' : 'Family',
      breakthrough: lang === 'fa' ? 'پیروزی' : 'Breakthrough',
      general: lang === 'fa' ? 'عمومی' : 'General'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'testimony': return lang === 'fa' ? 'شهادت' : 'Testimony';
      case 'blessing': return lang === 'fa' ? 'برکت' : 'Blessing';
      case 'confession': return lang === 'fa' ? 'اعتراف' : 'Confession';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'testimony': return '🙌';
      case 'blessing': return '✨';
      case 'confession': return '💖';
      default: return '📝';
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            ✓ {lang === 'fa' ? 'تایید شده' : 'Verified'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            ⏳ {lang === 'fa' ? 'در انتظار تایید' : 'Pending'}
          </span>
        );
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return lang === 'fa' ? `${diffInMinutes} دقیقه پیش` : `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return lang === 'fa' ? `${hours} ساعت پیش` : `${hours} hours ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return lang === 'fa' ? `${days} روز پیش` : `${days} days ago`;
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      testimonial.testimonialText.toLowerCase().includes(searchLower) ||
      (testimonial.name && testimonial.name.toLowerCase().includes(searchLower)) ||
      (testimonial.location && testimonial.location.toLowerCase().includes(searchLower));
    
    return matchesSearch;
  });

  const categories = [
    { value: 'all', label: lang === 'fa' ? 'همه' : 'All' },
    { value: 'general', label: lang === 'fa' ? 'عمومی' : 'General' },
    { value: 'healing', label: lang === 'fa' ? 'شفا' : 'Healing' },
    { value: 'salvation', label: lang === 'fa' ? 'نجات' : 'Salvation' },
    { value: 'provision', label: lang === 'fa' ? 'تامین نیاز' : 'Provision' },
    { value: 'guidance', label: lang === 'fa' ? 'راهنمایی' : 'Guidance' },
    { value: 'family', label: lang === 'fa' ? 'خانواده' : 'Family' },
    { value: 'breakthrough', label: lang === 'fa' ? 'پیروزی' : 'Breakthrough' }
  ];

  const types = [
    { value: 'all', label: lang === 'fa' ? 'همه' : 'All' },
    { value: 'testimony', label: lang === 'fa' ? 'شهادت' : 'Testimony' },
    { value: 'blessing', label: lang === 'fa' ? 'برکت' : 'Blessing' },
    { value: 'confession', label: lang === 'fa' ? 'اعتراف' : 'Confession' }
  ];

  const sortOptions = [
    { value: 'newest', label: lang === 'fa' ? 'جدیدترین' : 'Newest' },
    { value: 'oldest', label: lang === 'fa' ? 'قدیمی‌ترین' : 'Oldest' },
    { value: 'rating', label: lang === 'fa' ? 'بالاترین امتیاز' : 'Highest Rating' },
    { value: 'likes', label: lang === 'fa' ? 'بیشترین لایک' : 'Most Liked' }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            {lang === 'fa' ? 'شهادت‌ها و برکات' : 'Testimonials & Blessings'}
          </h2>
          <button
            onClick={fetchTestimonials}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title={lang === 'fa' ? 'بروزرسانی' : 'Refresh'}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'fa' ? 'جستجو در شهادت‌ها...' : 'Search testimonials...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'fa' ? 'دسته‌بندی' : 'Category'}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'fa' ? 'نوع' : 'Type'}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'fa' ? 'مرتب‌سازی' : 'Sort by'}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setSortBy('newest');
                }}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {lang === 'fa' ? 'پاک کردن فیلترها' : 'Clear Filters'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-lg">
              {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchTestimonials}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {lang === 'fa' ? 'تلاش مجدد' : 'Try Again'}
            </button>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {lang === 'fa' ? 'هیچ شهادتی یافت نشد' : 'No testimonials found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {!testimonial.isAnonymous && (
                      <img 
                        src={`/images/avatar-christian-${['male-1', 'female-1', 'elder'][Math.floor(Math.random() * 3)]}.jpg`}
                        alt={testimonial.name || 'User'}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/church-logo-hq.png';
                        }}
                      />
                    )}
                    {testimonial.isAnonymous && (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <span className="text-xl">{getTypeIcon(testimonial.type)}</span>
                    <span className="text-lg">{getCategoryIcon(testimonial.category)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {testimonial.isAnonymous ? (
                            lang === 'fa' ? 'ناشناس' : 'Anonymous'
                          ) : (
                            testimonial.name
                          )}
                        </span>
                        {getVerificationBadge(testimonial.verificationStatus)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {getTypeLabel(testimonial.type)} • {getCategoryLabel(testimonial.category)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTimeAgo(testimonial.createdAt)}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${
                        testimonial.rating >= star ? 'text-yellow-500 fill-current' : 'text-gray-300'
                      }`} 
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {testimonial.rating}/5
                  </span>
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {testimonial.testimonialText}
                </p>

                {/* Metadata */}
                {(testimonial.dateOfEvent || testimonial.location) && (
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    {testimonial.dateOfEvent && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(testimonial.dateOfEvent).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}
                      </div>
                    )}
                    {testimonial.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {testimonial.location}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikeTestimonial(testimonial.id)}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        testimonial.hasUserLiked
                          ? 'text-red-600'
                          : 'text-gray-600 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${testimonial.hasUserLiked ? 'fill-current' : ''}`} />
                      {testimonial.likesCount}
                    </button>
                    
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                      {lang === 'fa' ? 'اشتراک' : 'Share'}
                    </button>
                  </div>
                  
                  {showAdminControls && (
                    <div className="flex items-center gap-2">
                      <button className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                        {lang === 'fa' ? 'ویرایش' : 'Edit'}
                      </button>
                      <button className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                        {lang === 'fa' ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialsWall;
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileCompleteness } from '@/components/ProfileCompleteness';

describe('ProfileCompleteness', () => {
  it('routes the KYC completion CTA to the profile page', () => {
    render(
      <MemoryRouter>
        <ProfileCompleteness
          profile={{
            id: 'profile-1',
            user_id: 'streamer-1',
            bio: 'Streamer bio',
            platforms: ['Kick'],
            follower_count: 1000,
            avg_live_viewers: 100,
            engagement_rate: 3,
            monthly_impressions: 5000,
            audience_geo: ['CA'],
            payment_preference: 'USDT',
            restricted_countries: [],
            rating_avg: 0,
            rating_count: 0,
            verified: 'pending' as never,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            niche_type: null,
            twitch_url: null,
            kick_url: null,
            youtube_url: null,
            twitter_url: null,
            instagram_url: null,
            tiktok_url: null,
            discord_url: null,
            wallet_address: null,
            preferred_crypto: null,
            minimum_fee: null,
          }}
          listingsCount={1}
          kycStatus="unverified"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Finish: KYC submitted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /fix this/i })).toHaveAttribute('href', '/profile');
  });
});

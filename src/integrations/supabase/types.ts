export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      album_share_claim_memories: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          imported_memory_id: string
          source_memory_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          imported_memory_id: string
          source_memory_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          imported_memory_id?: string
          source_memory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_share_claim_memories_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "album_share_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_share_claim_memories_imported_memory_id_fkey"
            columns: ["imported_memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_share_claim_memories_source_memory_id_fkey"
            columns: ["source_memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      album_share_claims: {
        Row: {
          claimed_at: string
          id: string
          imported_folder_id: string | null
          recipient_user_id: string
          share_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          imported_folder_id?: string | null
          recipient_user_id: string
          share_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          imported_folder_id?: string | null
          recipient_user_id?: string
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_share_claims_imported_folder_id_fkey"
            columns: ["imported_folder_id"]
            isOneToOne: false
            referencedRelation: "memory_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_share_claims_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "album_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      album_share_recipients: {
        Row: {
          created_at: string
          id: string
          recipient_email: string
          share_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_email: string
          share_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_email?: string
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_share_recipients_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "album_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      album_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          folder_id: string
          id: string
          is_redeemable: boolean
          mode: string
          public_token: string | null
          revoked_at: string | null
          share_code: string | null
          share_message: string | null
          share_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          folder_id: string
          id?: string
          is_redeemable?: boolean
          mode?: string
          public_token?: string | null
          revoked_at?: string | null
          share_code?: string | null
          share_message?: string | null
          share_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          folder_id?: string
          id?: string
          is_redeemable?: boolean
          mode?: string
          public_token?: string | null
          revoked_at?: string | null
          share_code?: string | null
          share_message?: string | null
          share_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_shares_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: true
            referencedRelation: "memory_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      archaeology_items: {
        Row: {
          collection: string
          created_at: string
          favorite: boolean
          id: string
          idol_id: string | null
          image_position: number
          image_url: string
          is_manual_cover: boolean
          note: string
          source: string
          tags: string[]
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          collection?: string
          created_at?: string
          favorite?: boolean
          id?: string
          idol_id?: string | null
          image_position?: number
          image_url?: string
          is_manual_cover?: boolean
          note?: string
          source?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          collection?: string
          created_at?: string
          favorite?: boolean
          id?: string
          idol_id?: string | null
          image_position?: number
          image_url?: string
          is_manual_cover?: boolean
          note?: string
          source?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archaeology_items_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          acquired_date: string | null
          campaign_id: string | null
          category: string
          created_at: string
          event_id: string | null
          external_url: string | null
          favorite: boolean
          id: string
          idol_id: string | null
          note: string | null
          origin: string
          partner_id: string | null
          photo: string | null
          provenance: string
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          acquired_date?: string | null
          campaign_id?: string | null
          category: string
          created_at?: string
          event_id?: string | null
          external_url?: string | null
          favorite?: boolean
          id?: string
          idol_id?: string | null
          note?: string | null
          origin?: string
          partner_id?: string | null
          photo?: string | null
          provenance?: string
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          acquired_date?: string | null
          campaign_id?: string | null
          category?: string
          created_at?: string
          event_id?: string | null
          external_url?: string | null
          favorite?: boolean
          id?: string
          idol_id?: string | null
          note?: string | null
          origin?: string
          partner_id?: string | null
          photo?: string | null
          provenance?: string
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      comeback_diaries: {
        Row: {
          created_at: string
          event_id: string
          first_favorite_song_id: string | null
          first_listen_rating: number | null
          id: string
          idol_id: string
          later_favorite_song_id: string | null
          note: string
          updated_at: string
          user_id: string
          want_to_hear_live_song_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          first_favorite_song_id?: string | null
          first_listen_rating?: number | null
          id?: string
          idol_id: string
          later_favorite_song_id?: string | null
          note?: string
          updated_at?: string
          user_id: string
          want_to_hear_live_song_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          first_favorite_song_id?: string | null
          first_listen_rating?: number | null
          id?: string
          idol_id?: string
          later_favorite_song_id?: string | null
          note?: string
          updated_at?: string
          user_id?: string
          want_to_hear_live_song_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comeback_diaries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comeback_diaries_first_favorite_song_id_fkey"
            columns: ["first_favorite_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comeback_diaries_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comeback_diaries_later_favorite_song_id_fkey"
            columns: ["later_favorite_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comeback_diaries_want_to_hear_live_song_id_fkey"
            columns: ["want_to_hear_live_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      comeback_era_memory_folders: {
        Row: {
          created_at: string
          event_id: string
          folder_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          folder_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          folder_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comeback_era_memory_folders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comeback_era_memory_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: true
            referencedRelation: "memory_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      concert_music_memories: {
        Row: {
          anticipated_song_id: string | null
          created_at: string
          event_id: string
          finally_heard_song_id: string | null
          hype_song_id: string | null
          id: string
          idol_id: string
          most_emotional_song_id: string | null
          note: string
          opening_song_id: string | null
          tearjerker_song_id: string | null
          unforgettable_song_id: string | null
          updated_at: string
          user_id: string
          want_to_hear_song_id: string | null
        }
        Insert: {
          anticipated_song_id?: string | null
          created_at?: string
          event_id: string
          finally_heard_song_id?: string | null
          hype_song_id?: string | null
          id?: string
          idol_id: string
          most_emotional_song_id?: string | null
          note?: string
          opening_song_id?: string | null
          tearjerker_song_id?: string | null
          unforgettable_song_id?: string | null
          updated_at?: string
          user_id: string
          want_to_hear_song_id?: string | null
        }
        Update: {
          anticipated_song_id?: string | null
          created_at?: string
          event_id?: string
          finally_heard_song_id?: string | null
          hype_song_id?: string | null
          id?: string
          idol_id?: string
          most_emotional_song_id?: string | null
          note?: string
          opening_song_id?: string | null
          tearjerker_song_id?: string | null
          unforgettable_song_id?: string | null
          updated_at?: string
          user_id?: string
          want_to_hear_song_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concert_music_memories_anticipated_song_id_fkey"
            columns: ["anticipated_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_finally_heard_song_id_fkey"
            columns: ["finally_heard_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_hype_song_id_fkey"
            columns: ["hype_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_most_emotional_song_id_fkey"
            columns: ["most_emotional_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_opening_song_id_fkey"
            columns: ["opening_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_tearjerker_song_id_fkey"
            columns: ["tearjerker_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_unforgettable_song_id_fkey"
            columns: ["unforgettable_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_music_memories_want_to_hear_song_id_fkey"
            columns: ["want_to_hear_song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      concert_personal_memories: {
        Row: {
          created_at: string
          event_id: string
          id: string
          idol_id: string | null
          photo: string | null
          seat: string | null
          unforgettable_moment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          idol_id?: string | null
          photo?: string | null
          seat?: string | null
          unforgettable_moment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          idol_id?: string | null
          photo?: string | null
          seat?: string | null
          unforgettable_moment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concert_personal_memories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_personal_memories_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string
          created_at: string
          date: string
          id: string
          idol_id: string
          location_name: string
          note: string
          title: string
          type: string
          updated_at: string
          user_id: string
          weather_enabled: boolean
          weather_tone: string
        }
        Insert: {
          city?: string
          created_at?: string
          date: string
          id?: string
          idol_id: string
          location_name?: string
          note?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
          weather_enabled?: boolean
          weather_tone?: string
        }
        Update: {
          city?: string
          created_at?: string
          date?: string
          id?: string
          idol_id?: string
          location_name?: string
          note?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          weather_enabled?: boolean
          weather_tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      idol_song_journal_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          idol_id: string
          mood: string | null
          song_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          id?: string
          idol_id: string
          mood?: string | null
          song_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          idol_id?: string
          mood?: string | null
          song_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idol_song_journal_entries_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idol_song_journal_entries_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      idol_song_listen_again_entries: {
        Row: {
          created_at: string
          current_mood: string
          id: string
          idol_id: string
          listen_again_date: string
          original_date: string
          original_mood: string | null
          song_id: string
          source_journal_entry_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_mood: string
          id?: string
          idol_id: string
          listen_again_date: string
          original_date: string
          original_mood?: string | null
          song_id: string
          source_journal_entry_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_mood?: string
          id?: string
          idol_id?: string
          listen_again_date?: string
          original_date?: string
          original_mood?: string | null
          song_id?: string
          source_journal_entry_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idol_song_listen_again_entries_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idol_song_listen_again_entries_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idol_song_listen_again_entries_source_journal_entry_id_fkey"
            columns: ["source_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "idol_song_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      idol_song_roles: {
        Row: {
          created_at: string
          id: string
          idol_id: string
          role: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idol_id: string
          role: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idol_id?: string
          role?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idol_song_roles_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idol_song_roles_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      idol_songs: {
        Row: {
          album: string
          apple_music_url: string
          artist: string
          created_at: string
          id: string
          idol_id: string
          is_today_pick: boolean
          spotify_url: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          album?: string
          apple_music_url?: string
          artist?: string
          created_at?: string
          id?: string
          idol_id: string
          is_today_pick?: boolean
          spotify_url?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          album?: string
          apple_music_url?: string
          artist?: string
          created_at?: string
          id?: string
          idol_id?: string
          is_today_pick?: boolean
          spotify_url?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idol_songs_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      idols: {
        Row: {
          birthday: string | null
          created_at: string
          debut_date: string | null
          fan_name: string
          favorite_color: string
          group_name: string
          id: string
          name: string
          photo: string
          photo_position: number
          representative_animal: string
          since_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          debut_date?: string | null
          fan_name?: string
          favorite_color?: string
          group_name?: string
          id?: string
          name: string
          photo?: string
          photo_position?: number
          representative_animal?: string
          since_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          created_at?: string
          debut_date?: string | null
          fan_name?: string
          favorite_color?: string
          group_name?: string
          id?: string
          name?: string
          photo?: string
          photo_position?: number
          representative_animal?: string
          since_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meet_memories: {
        Row: {
          actually_said: string | null
          afterthought: string | null
          created_at: string
          event_id: string
          id: string
          idol_id: string | null
          idol_moment: string | null
          photo: string | null
          updated_at: string
          user_id: string
          wanted_to_say: string | null
        }
        Insert: {
          actually_said?: string | null
          afterthought?: string | null
          created_at?: string
          event_id: string
          id?: string
          idol_id?: string | null
          idol_moment?: string | null
          photo?: string | null
          updated_at?: string
          user_id: string
          wanted_to_say?: string | null
        }
        Update: {
          actually_said?: string | null
          afterthought?: string | null
          created_at?: string
          event_id?: string
          id?: string
          idol_id?: string | null
          idol_moment?: string | null
          photo?: string | null
          updated_at?: string
          user_id?: string
          wanted_to_say?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meet_memories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meet_memories_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          created_at: string
          date: string | null
          folder_id: string
          id: string
          idol_id: string | null
          note: string
          photo: string
          photo_position: number
          song_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          folder_id: string
          id?: string
          idol_id?: string | null
          note?: string
          photo?: string
          photo_position?: number
          song_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          folder_id?: string
          id?: string
          idol_id?: string | null
          note?: string
          photo?: string
          photo_position?: number
          song_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "memory_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "idol_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_folders: {
        Row: {
          cover_photo: string
          cover_photo_position: number
          created_at: string
          description: string
          end_date: string | null
          id: string
          idol_id: string | null
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_photo?: string
          cover_photo_position?: number
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          idol_id?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_photo?: string
          cover_photo_position?: number
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          idol_id?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_folders_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed: boolean
          created_at: string
          date: string | null
          emoji: string
          event_id: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date?: string | null
          emoji?: string
          event_id: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string | null
          emoji?: string
          event_id?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cover_rotation: boolean
          created_at: string
          date_format: string
          display_name: string
          id: string
          language: string
          main_idol_id: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_rotation?: boolean
          created_at?: string
          date_format?: string
          display_name?: string
          id?: string
          language?: string
          main_idol_id?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_rotation?: boolean
          created_at?: string
          date_format?: string
          display_name?: string
          id?: string
          language?: string
          main_idol_id?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_main_idol_id_fkey"
            columns: ["main_idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          days_before: number
          enabled: boolean
          event_id: string | null
          id: string
          idol_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_before?: number
          enabled?: boolean
          event_id?: string | null
          id?: string
          idol_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_before?: number
          enabled?: boolean
          event_id?: string | null
          id?: string
          idol_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      sugar_items: {
        Row: {
          created_at: string
          date: string | null
          id: string
          idol_id: string | null
          image: string
          link: string
          note: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          idol_id?: string | null
          image?: string
          link?: string
          note?: string
          title?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          idol_id?: string | null
          image?: string
          link?: string
          note?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sugar_items_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      widget_preferences: {
        Row: {
          created_at: string
          enabled_contents: string[]
          idol_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled_contents?: string[]
          idol_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled_contents?: string[]
          idol_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_preferences_idol_id_fkey"
            columns: ["idol_id"]
            isOneToOne: false
            referencedRelation: "idols"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_claimed_album_media: {
        Args: { object_name: string }
        Returns: boolean
      }
      claim_album_share_code: {
        Args: { p_code: string }
        Returns: {
          folder_id: string
          imported_memory_count: number
          share_id: string
          share_message: string
          share_title: string
        }[]
      }
      enable_album_share_code: {
        Args: { p_folder_id: string; p_message?: string; p_title?: string }
        Returns: {
          share_code: string
          share_id: string
        }[]
      }
      generate_album_share_code: { Args: never; Returns: string }
      get_claimed_album_source: {
        Args: { p_folder_id: string }
        Returns: {
          claimed_at: string
          sender_name: string
          share_message: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      preview_album_share_code: {
        Args: { p_code: string }
        Returns: {
          folder_title: string
          memory_count: number
          sender_name: string
          share_id: string
          share_message: string
          share_title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

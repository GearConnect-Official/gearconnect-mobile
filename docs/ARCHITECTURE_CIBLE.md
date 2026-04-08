# Architecture cible — GearConnect Mobile

## Proposition Nabou (06 Avril 2026) modifié ce matin par mes soins

```
gearconnect-mobile/
│
├── app/
│   ├── (app)/
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── home.tsx
│   │   │   ├── events.tsx
│   │   │   ├── publications.tsx
│   │   │   └── index.tsx
│   │   ├── _layout.tsx
│   │   ├── (home)/
│   │   │   ├── (postDetail)/
│   │   │   │   └── postDetail.tsx
│   │   │   ├── (userProfile)/             ← route partagée, accédée depuis 14 endroits (feed, search, events, messages, groups…)
│   │   │   │   └── userProfile.tsx
│   │   │   ├── (search)/
│   │   │   │   └── userSearch.tsx
│   │   │   ├── (messages)/
│   │   │   │   ├── messages.tsx
│   │   │   │   ├── (groups)/
│   │   │   │   │   ├── groups.tsx
│   │   │   │   │   ├── eventGroups.tsx
│   │   │   │   │   └── (groupsDetail)/
│   │   │   │   │       ├── groupDetail.tsx
│   │   │   │   │       └── (groupsChannel)/
│   │   │   │   │           └── groupChannel.tsx
│   │   │   │   ├── (conversation)/
│   │   │   │   │   └── conversation.tsx
│   │   │   │   └── (newConversation)/
│   │   │   │       └── newConversation.tsx
│   │   │   └── (profile)/
│   │   │       ├── (settings)/
│   │   │       │   ├── settings.tsx
│   │   │       │   ├── (privacySettings)/
│   │   │       │   │   └── privacySettings.tsx
│   │   │       │   ├── (notificationSettings)/
│   │   │       │   │   └── notificationSettings.tsx
│   │   │       │   ├── (permissions)/
│   │   │       │   │   └── permissions.tsx
│   │   │       │   ├── (termsAndConditions)/
│   │   │       │   │   └── termsAndConditions.tsx
│   │   │       │   └── (verificationRequest)/
│   │   │       │       └── verificationRequest.tsx
│   │   │       ├── (followList)/
│   │   │       │   └── followList.tsx
│   │   │       ├── (editProfile)/
│   │   │       │   └── editProfile.tsx
│   │   │       └── (performances)/
│   │   │           ├── performances.tsx
│   │   │           └── (addPerformances)/
│   │   │               ├── addPerformance.tsx
│   │   │               └── selectEvent.tsx
│   │   ├── (events)/
│   │   │   ├── (createEvents)/
│   │   │   │   ├── createEvent.tsx
│   │   │   │   └── selectOrganizers.tsx
│   │   │   ├── (myCreatedEvents)/
│   │   │   │   └── myCreatedEvents.tsx
│   │   │   └── (eventDetails)/
│   │   │       ├── eventDetail.tsx
│   │   │       ├── postEventInfo.tsx
│   │   │       ├── productList.tsx
│   │   │       ├── (createEventReview)/
│   │   │       │   └── createEventReview.tsx
│   │   │       ├── (modifyEventReview)/
│   │   │       │   └── modifyEventReview.tsx
│   │   │       └── (editEvent)/
│   │   │           └── editEvent.tsx
│   │   ├── (publication)/
│   │   │   └── publication.tsx
│   │   ├── (verification)/
│   │   │   └── verificationDashboard.tsx
│   │   ├── verify.tsx
│   │   └── index.tsx
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgotPassword.tsx
│   │   └── index.tsx
│   │
│   ├── _layout.tsx
│   ├── +html.tsx
│   └── index.tsx
│
├── src/
│   ├── components/
│   │   ├── events/
│   │   │   ├── CreateEvent/
│   │   │   │   ├── ActionButtons.tsx
│   │   │   │   ├── AdditionalInfo.tsx
│   │   │   │   ├── BasicInfo.tsx
│   │   │   │   ├── ImageUpload.tsx
│   │   │   │   ├── InputField.tsx
│   │   │   │   ├── MediaInfo.tsx
│   │   │   │   ├── NavigationButtons.tsx
│   │   │   │   ├── ProductList.tsx
│   │   │   │   ├── StepIndicator.tsx
│   │   │   │   ├── TopBar.tsx
│   │   │   │   └── index.ts
│   │   │   ├── EventDetail/
│   │   │   │   └── RelatedProductsSection.tsx
│   │   │   ├── EventResults/
│   │   │   │   ├── EventResultsGrid.tsx
│   │   │   │   └── CreateEventForm.tsx
│   │   │   ├── EventDetailReview.tsx
│   │   │   ├── EventTag.tsx
│   │   │   ├── ModifyEvent.tsx
│   │   │   └── EventItem.tsx
│   │   ├── home/
│   │   │   ├── Feed/
│   │   │   │   ├── HierarchicalComment.tsx
│   │   │   │   ├── PostActions.tsx
│   │   │   │   ├── PostFooter.tsx
│   │   │   │   ├── PostHeader.tsx
│   │   │   │   ├── PostItem.tsx
│   │   │   │   ├── PostOptionsButton.tsx
│   │   │   │   ├── PostOptionsMenu.tsx
│   │   │   │   ├── ProfilePost.tsx
│   │   │   │   ├── ShareModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── stories/
│   │   │   │   ├── StoryPreview.tsx
│   │   │   │   ├── StoryViewer.tsx
│   │   │   │   └── Post.tsx
│   │   │   ├── profile/
│   │   │   │   ├── CloudinaryProfileAvatar.tsx
│   │   │   │   ├── ProfileMenu.tsx
│   │   │   │   ├── ProfilePictureUpload.tsx
│   │   │   │   └── index.ts
│   │   │   ├── messaging/
│   │   │   │   └── ...fichiers messaging
│   │   │   └── social/
│   │   │       ├── FollowButton.tsx
│   │   │       ├── GroupMemberItem.tsx
│   │   │       ├── UserProfile.tsx
│   │   │       └── index.ts
│   │   ├── publication/
│   │   │   ├── CaptionInput.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── ImageCropper.tsx
│   │   │   ├── ImageViewer.tsx
│   │   │   ├── MediaSection.tsx
│   │   │   ├── PublicationForm.tsx
│   │   │   └── index.ts
│   │   ├── media/
│   │   │   ├── AspectBannerImage.tsx
│   │   │   ├── CloudinaryImage.tsx
│   │   │   ├── CloudinaryImageUpload.tsx
│   │   │   ├── CloudinaryMedia.tsx
│   │   │   ├── CloudinaryVideo.tsx
│   │   │   ├── CloudinaryVideoUpload.tsx
│   │   │   ├── VerifiedAvatar.tsx
│   │   │   └── index.ts
│   │   ├── modals/
│   │   │   ├── CommentsModal.tsx
│   │   │   ├── HierarchicalCommentsModal.tsx
│   │   │   ├── StoryModal.tsx
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── ...fichiers UI
│   │       └── index.ts
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── MessagingProvider.tsx
│   │   ├── AnalyticsProvider.tsx
│   │   ├── AppProviders.tsx
│   │   └── index.tsx
│   ├── hooks/
│   │   ├── useCloudinary.ts
│   │   ├── useConversation.ts
│   │   ├── useFeedback.tsx
│   │   ├── useInfiniteScroll.ts
│   │   ├── useNetworkStatus.tsx
│   │   ├── useOptimizedInteractions.ts
│   │   ├── usePostsCache.ts
│   │   ├── useScreenTracking.ts
│   │   ├── useVisibilityTracker.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── axiosConfig.ts
│   │   ├── chatService.ts
│   │   ├── cloudinary.service.ts
│   │   ├── commentService.ts
│   │   ├── eventService.ts
│   │   ├── favoritesService.ts
│   │   ├── followService.ts
│   │   ├── groupService.ts
│   │   ├── keepAwakeService.ts
│   │   ├── messageService.ts
│   │   ├── mixpanelService.ts
│   │   ├── notificationService.ts
│   │   ├── performanceService.ts
│   │   ├── postService.ts
│   │   ├── privacySettingsService.ts
│   │   ├── relatedProductService.ts
│   │   ├── sessionReplayService.ts
│   │   ├── tagService.ts
│   │   ├── userService.ts
│   │   ├── verificationService.ts
│   │   └── websocketService.ts
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── event.types.ts
│   │   ├── follow.types.ts
│   │   ├── group.ts
│   │   ├── messages.ts
│   │   ├── performance.types.ts
│   │   ├── post.ts
│   │   ├── story.ts
│   │   └── userStatus.ts
│   ├── utils/
│   │   ├── calendarHelper.ts
│   │   ├── dateUtils.ts
│   │   ├── eventMissingInfo.ts
│   │   ├── eventSelection.ts
│   │   ├── fileSecurity.ts
│   │   ├── mediaUtils.ts
│   │   ├── messageUtils.ts
│   │   ├── mixpanelTracking.ts
│   │   ├── postFetchFactories.ts
│   │   └── yamlLoader.ts
│   ├── styles/
│   │   └── ...fichiers styles
│   ├── config/
│   │   ├── constants.ts
│   │   ├── defaultImage.ts
│   │   └── env.ts
│   ├── content/
│   │   ├── termsAndConditions.ts
│   │   └── termsAndConditions.yaml
│
├── assets/
│   ├── index.ts
│   ├── fonts/
│   └── images/
│
├── __tests__/
│
└── docs/
    ├── ARCHITECTURE_CIBLE.md
    ├── ARCHITECTURE.md
    ├── CLOUDINARY_INTEGRATION.md
    └── OPTIMIZED_POSTS_ARCHITECTURE.md
```

import { useEffect, useRef, useState } from "react";
import "./social.css";

const VIEWER = {
  id: "u1",
  username: "zack",
  bio: "Building things. Sharing photos with friends.",
  avatar: "https://picsum.photos/seed/social-zack/120/120",
};

const FRIENDS = [
  {
    id: "u2",
    username: "maya",
    email: "maya@example.com",
    avatar: "https://picsum.photos/seed/social-maya/120/120",
  },
  {
    id: "u3",
    username: "jordan",
    email: "jordan@example.com",
    avatar: "https://picsum.photos/seed/social-jordan/120/120",
  },
  {
    id: "u4",
    username: "sam",
    email: "sam@example.com",
    avatar: "https://picsum.photos/seed/social-sam/120/120",
  },
];

const INCOMING_REQUESTS = [
  {
    id: "req1",
    username: "alex",
    email: "alex@example.com",
    avatar: "https://picsum.photos/seed/social-alex/120/120",
  },
];

const POST_GROUPS = [
  { id: "g1", name: "Close friends", members: ["maya", "jordan"] },
  { id: "g2", name: "Hiking crew", members: ["maya", "sam"] },
  { id: "g3", name: "Dev buddies", members: ["jordan"] },
];

const CUSTOM_EMOJIS = [
  { id: "e1", name: "blob", color: "#0a84ff", glyph: "●" },
  { id: "e2", name: "spark", color: "#f5c542", glyph: "✦" },
  { id: "e3", name: "wave", color: "#5ac8fa", glyph: "~" },
  { id: "e4", name: "heartpix", color: "#ff5a5f", glyph: "♥" },
  { id: "e5", name: "bean", color: "#34c759", glyph: "◆" },
  { id: "e6", name: "moon", color: "#bf5af2", glyph: "☽" },
];

const REACTION_PICKER = ["🔥", "😂", "❤️", "👍", "🎉", "😮"];

const INITIAL_POSTS = [
  {
    id: "p1",
    createdBy: "u2",
    username: "maya",
    createdAt: "Jul 18",
    text: "Sunset hike above the lake — worth the climb.",
    image: "https://picsum.photos/seed/social-post1/800/800",
    avatar: "https://picsum.photos/seed/social-maya/120/120",
    likeCount: 12,
    likedByViewer: false,
    reactions: ["🔥", "😮", "❤️"],
    comments: [
      { id: "c1", username: "zack", text: "That light is unreal." },
      { id: "c2", username: "sam", text: "Need the trail name!" },
    ],
  },
  {
    id: "p2",
    createdBy: "u1",
    username: "zack",
    createdAt: "Jul 16",
    text: "Prototype night. Coffee optional, debugging mandatory.",
    image: "https://picsum.photos/seed/social-post2/800/800",
    avatar: VIEWER.avatar,
    likeCount: 7,
    likedByViewer: true,
    reactions: ["👍", "😂"],
    comments: [
      { id: "c3", username: "jordan", text: "Ship it before sunrise." },
    ],
  },
  {
    id: "p3",
    createdBy: "u3",
    username: "jordan",
    createdAt: "Jul 14",
    text: "Group trip leftovers: three cameras, one shared album.",
    image: "https://picsum.photos/seed/social-post3/800/800",
    avatar: "https://picsum.photos/seed/social-jordan/120/120",
    likeCount: 24,
    likedByViewer: false,
    reactions: ["🎉", "🔥", "❤️", "😂"],
    comments: [
      { id: "c4", username: "maya", text: "Best weekend this year." },
      { id: "c5", username: "zack", text: "That mid-roll is my favorite." },
    ],
  },
  {
    id: "p4",
    createdBy: "u1",
    username: "zack",
    createdAt: "Jul 11",
    text: "Weekend bench. Still figuring out the feed layout.",
    image: "https://picsum.photos/seed/social-post4/800/800",
    avatar: VIEWER.avatar,
    likeCount: 5,
    likedByViewer: false,
    reactions: ["👍"],
    comments: [],
  },
  {
    id: "p5",
    createdBy: "u4",
    username: "sam",
    createdAt: "Jul 9",
    text: "First snow of the season (allegedly).",
    image: "https://picsum.photos/seed/social-post5/800/800",
    avatar: "https://picsum.photos/seed/social-sam/120/120",
    likeCount: 18,
    likedByViewer: false,
    reactions: ["😮", "❄️", "🔥"],
    comments: [
      { id: "c6", username: "maya", text: "Already??" },
    ],
  },
];

const PROFILE_SUB_TABS = [
  { id: "posts", label: "Posts" },
  { id: "friends", label: "Friends" },
  { id: "groups", label: "Groups" },
  { id: "emojis", label: "Emojis" },
];

function IconHouse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 19c.8-3.2 3-5 6.5-5s5.7 1.8 6.5 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 19c.4-1.8 1.6-3 3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 19.5c1.2-3.5 3.8-5.5 7.5-5.5s6.3 2 7.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-5 4v-4.5A2.5 2.5 0 0 1 4 13.5v-8z" strokeLinejoin="round" />
    </svg>
  );
}

function IconHeart({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M12 20s-7-4.4-9.2-8.2C1.2 9.2 2.4 6 5.5 5.3c1.8-.4 3.5.4 4.5 1.8 1-1.4 2.7-2.2 4.5-1.8 3.1.7 4.3 3.9 2.7 6.5C19 15.6 12 20 12 20z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSmile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10h.01M15.5 10h.01M8.5 14.5c1.2 1.2 2.4 1.8 3.5 1.8s2.3-.6 3.5-1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" width="12" height="12" aria-hidden>
      <path d="M5 12.5 10 17.5 19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PostCard({ post, onToggleLike, onAddReaction, onAddComment }) {
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const submitComment = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(post.id, text);
    setDraft("");
  };

  return (
    <article className="social-post">
      <header className="social-post__header">
        <img className="social-post__avatar" src={post.avatar} alt="" />
        <div className="social-post__meta">
          <p className="social-post__username">{post.username}</p>
          <p className="social-post__date">{post.createdAt}</p>
        </div>
        <span className="social-post__more" aria-hidden>
          <IconMore />
        </span>
      </header>
      <img className="social-post__image" src={post.image} alt="" />
      <div className="social-post__body">
        <p className="social-post__caption">{post.text}</p>

        <div className="social-post__actions">
          <button
            type="button"
            className={`social-like-btn${post.likedByViewer ? " social-like-btn--liked" : ""}`}
            onClick={() => onToggleLike(post.id)}
            aria-pressed={post.likedByViewer}
            aria-label={post.likedByViewer ? "Unlike post" : "Like post"}
          >
            <IconHeart filled={post.likedByViewer} />
            <span>{post.likeCount}</span>
          </button>

          <div className="social-emoji-wrap">
            <button
              type="button"
              className="social-emoji-btn"
              onClick={() => setPickerOpen((open) => !open)}
              aria-expanded={pickerOpen}
              aria-label="Add reaction"
            >
              <IconSmile />
            </button>
            {pickerOpen ? (
              <div className="social-emoji-picker" role="listbox" aria-label="Reactions">
                {REACTION_PICKER.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="social-emoji-picker__item"
                    onClick={() => {
                      onAddReaction(post.id, emoji);
                      setPickerOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {post.reactions.length > 0 ? (
            <div className="social-reactions">
              {post.reactions.map((emoji, index) => (
                <span key={`${emoji}-${index}`} className="social-reactions__item">
                  {emoji}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="social-comments">
          <div className="social-comments__compose">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitComment();
              }}
              placeholder="Add a comment..."
              className="social-comments__input"
            />
            <button
              type="button"
              className="social-comments__send"
              onClick={submitComment}
              disabled={!draft.trim()}
            >
              Send
            </button>
          </div>
          {post.comments.map((comment) => (
            <div key={comment.id} className="social-comment">
              <span className="social-comment__user">{comment.username}</span>
              <span className="social-comment__text">{comment.text}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function FeedScreen({ posts, onToggleLike, onAddReaction, onAddComment }) {
  return (
    <div className="social-screen" aria-label="Feed">
      <button type="button" className="social-create-btn" disabled>
        + Create Post
      </button>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onToggleLike={onToggleLike}
          onAddReaction={onAddReaction}
          onAddComment={onAddComment}
        />
      ))}
    </div>
  );
}

function ProfilePostsTab({ posts }) {
  const myPosts = posts.filter((p) => p.createdBy === VIEWER.id);
  return (
    <div className="social-profile__grid">
      {myPosts.map((post) => (
        <img key={post.id} src={post.image} alt="" />
      ))}
    </div>
  );
}

function ProfileFriendsTab() {
  return (
    <div className="social-profile-panel">
      <input
        className="social-search"
        placeholder="Search to add or find friends..."
        readOnly
        defaultValue=""
      />

      <p className="social-section-label">Incoming requests ({INCOMING_REQUESTS.length})</p>
      <div className="social-friend-list">
        {INCOMING_REQUESTS.map((request) => (
          <div key={request.id} className="social-friend-row">
            <img src={request.avatar} alt="" className="social-friend-row__avatar" />
            <div className="social-friend-row__meta">
              <p className="social-friend-row__name">{request.username}</p>
              <p className="social-friend-row__sub">{request.email}</p>
            </div>
            <div className="social-friend-row__actions">
              <button type="button" className="social-btn-primary">Accept</button>
              <button type="button" className="social-btn-ghost">Reject</button>
            </div>
          </div>
        ))}
      </div>

      <p className="social-section-label">Your friends ({FRIENDS.length})</p>
      <div className="social-friend-list">
        {FRIENDS.map((friend) => (
          <div key={friend.id} className="social-friend-row">
            <img src={friend.avatar} alt="" className="social-friend-row__avatar" />
            <div className="social-friend-row__meta">
              <p className="social-friend-row__name">{friend.username}</p>
              <p className="social-friend-row__sub">{friend.email}</p>
            </div>
            <span className="social-friend-row__chevron" aria-hidden>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileGroupsTab() {
  return (
    <div className="social-profile-panel">
      <p className="social-panel-hint">
        Post groups control who can see a post. Tap a group to preview members.
      </p>
      <div className="social-group-list">
        {POST_GROUPS.map((group) => (
          <div key={group.id} className="social-group-card">
            <p className="social-group-card__name">{group.name}</p>
            <div className="social-group-card__members">
              {group.members.map((name) => (
                <span key={name} className="social-chip">{name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileEmojisTab() {
  return (
    <div className="social-profile-panel">
      <div className="social-emoji-editor-head">
        <p className="social-emoji-editor-head__title">Emoji Editor</p>
        <button type="button" className="social-btn-ghost" disabled>+ New</button>
      </div>
      <p className="social-panel-hint">Custom pixel emojis you can react with on posts.</p>
      <p className="social-panel-hint">
        (Not included in wireframe)
      </p>
    </div>
  );
}

function ProfileScreen({ posts }) {
  const [subTab, setSubTab] = useState("posts");
  const activeIndex = Math.max(
    0,
    PROFILE_SUB_TABS.findIndex((tab) => tab.id === subTab),
  );

  return (
    <div className="social-screen" aria-label="Profile">
      <div className="social-profile">
        <div className="social-profile__row">
          <img className="social-profile__avatar" src={VIEWER.avatar} alt="" />
          <div className="social-profile__info">
            <h2>{VIEWER.username}</h2>
            <p>{VIEWER.bio}</p>
          </div>
        </div>

        <div className="social-subtabs" role="tablist" aria-label="Profile sections">
          <div
            className="social-subtabs__pill"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
            aria-hidden
          />
          {PROFILE_SUB_TABS.map((tab) => {
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`social-subtabs__btn${isActive ? " social-subtabs__btn--active" : ""}`}
                onClick={() => setSubTab(tab.id)}
              >
                {isActive ? <IconCheck /> : null}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {subTab === "posts" ? <ProfilePostsTab posts={posts} /> : null}
        {subTab === "friends" ? <ProfileFriendsTab /> : null}
        {subTab === "groups" ? <ProfileGroupsTab /> : null}
        {subTab === "emojis" ? <ProfileEmojisTab /> : null}
      </div>
    </div>
  );
}

function StubScreen({ label }) {
  return (
    <div className="social-screen social-screen--stub" aria-label={label}>
      <p>{label} — coming soon in this wireframe.</p>
    </div>
  );
}

function Social() {
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const phoneWrapRef = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const onPointerMove = (event) => {
      const wrap = phoneWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const clampedX = Math.min(1, Math.max(0, x));
      const clampedY = Math.min(1, Math.max(0, y));
      const rotateY = (clampedX - 0.5) * 16;
      const rotateX = (0.5 - clampedY) * 12;
      setTilt({ rotateX, rotateY });
    };

    const onPointerLeave = () => {
      setTilt({ rotateX: 0, rotateY: 0 });
    };

    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("mouseleave", onPointerLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
    };
  }, []);

  const onToggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const likedByViewer = !post.likedByViewer;
        return {
          ...post,
          likedByViewer,
          likeCount: post.likeCount + (likedByViewer ? 1 : -1),
        };
      }),
    );
  };

  const onAddReaction = (postId, emoji) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return { ...post, reactions: [...post.reactions, emoji] };
      }),
    );
  };

  const onAddComment = (postId, text) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [
            ...post.comments,
            { id: `local-${Date.now()}`, username: VIEWER.username, text },
          ],
        };
      }),
    );
  };

  let screen;
  if (activeTab === "profile") {
    screen = <ProfileScreen posts={posts} />;
  } else if (activeTab === "groups") {
    screen = <StubScreen label="Groups" />;
  } else if (activeTab === "feedback") {
    screen = <StubScreen label="Feedback" />;
  } else {
    screen = (
      <FeedScreen
        posts={posts}
        onToggleLike={onToggleLike}
        onAddReaction={onAddReaction}
        onAddComment={onAddComment}
      />
    );
  }

  return (
    <div className="project-page social-page">
      <div className="social-page__intro">
        <h1>Social</h1>
      </div>

      <div className="social-phone-wrap" ref={phoneWrapRef}>
        <div
          className="social-phone"
          aria-label="Social app phone mockup"
          style={{
            transform: `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          }}
        >
          <span className="social-phone__btn-side social-phone__btn-side--silent" />
          <span className="social-phone__btn-side social-phone__btn-side--vol-up" />
          <span className="social-phone__btn-side social-phone__btn-side--vol-down" />
          <span className="social-phone__btn-power" />

          <div className="social-phone__screen">
            <div className="social-phone__island" />
            <div className="social-app">
              {screen}
              <nav className="social-tabbar" aria-label="App tabs">
                <button
                  type="button"
                  className={`social-tab${activeTab === "feed" ? " social-tab--active" : ""}`}
                  onClick={() => setActiveTab("feed")}
                  aria-label="Feed"
                  aria-current={activeTab === "feed" ? "page" : undefined}
                >
                  <IconHouse />
                </button>
                <button
                  type="button"
                  className={`social-tab${activeTab === "groups" ? " social-tab--active" : ""}`}
                  onClick={() => setActiveTab("groups")}
                  aria-label="Groups"
                  aria-current={activeTab === "groups" ? "page" : undefined}
                >
                  <IconUsers />
                </button>
                <button
                  type="button"
                  className={`social-tab${activeTab === "profile" ? " social-tab--active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                  aria-label="Profile"
                  aria-current={activeTab === "profile" ? "page" : undefined}
                >
                  <IconUser />
                </button>
                <button
                  type="button"
                  className={`social-tab social-tab--dim${activeTab === "feedback" ? " social-tab--active" : ""}`}
                  onClick={() => setActiveTab("feedback")}
                  aria-label="Feedback"
                  aria-current={activeTab === "feedback" ? "page" : undefined}
                >
                  <IconMessage />
                </button>
              </nav>
            </div>
            <div className="social-home-indicator" />
          </div>
        </div>
      </div>

      <div className="social-page__about">
        <p>
          This is an app I built for my friends and myself. It allows users to post photos to all or
          any subset of their friends, comment and react with custom emojis, share photos, plan
          events, create polls, call groups, etc. Since I built it in January 2026, we&apos;ve been
          using it consistently, and for many of my friends it&apos;s the only social media app
          they have.
        </p>
        <br />
        <p>
          What you see above is a minimal wireframe of the app. The app is currently private, but in the future I plan to release it to the public as an advertisement-free platform.
        </p>
        <br />
        <p className="social-page__stack">
          Built using React, PostgreSQL, S3, plus a locally hosted TURN server
        </p>
      </div>
    </div>
  );
}

export default Social;

export const site = {
  name: 'Wanzhu Hou',
  role: '<a href="https://www.cs.wisc.edu/" target="_blank" rel="noopener noreferrer">Department of Computer Sciences</a>, University of Wisconsin-Madison',
  bio: `I am a third-year PhD student, fortunately advised by <a href="https://pages.cs.wisc.edu/~paris/" target="_blank" rel="noopener noreferrer">Prof. Paraschos Koutris</a> at <a href="https://database.cs.wisc.edu/" target="_blank" rel="noopener noreferrer">UW-Madison Database Group</a>. My research focuses on query optimization.
  <br />
  Prior to joining UW-Madison, I received my B.E. in Computer Science from <a href="https://en.xjtu.edu.cn/" target="_blank" rel="noopener noreferrer">Xi'an Jiaotong University</a>, through <a href="https://en.wikipedia.org/wiki/Special_Class_for_the_Gifted_Young#Xi'an_Jiaotong_University" target="_blank" rel="noopener noreferrer">Honors Youth Program</a>.
  `,
  email: 'whou25@wisc.edu',
  socials: [
    { label: 'GitHub', url: 'https://github.com/DreamingHwz', icon: 'github' as const },
    { label: 'Google Scholar', url: 'https://scholar.google.com', icon: 'scholar' as const },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/wanzhu-hou-80a012367/', icon: 'linkedin' as const },
  ],
  cvUrl: '/cv.pdf',
  profileImage: '/images/profile/profile.jpg',
};

export const hobbies = {
  playlistBlurb: `When I'm not debugging queries, this is what I'm listening to.`,
  // Paste a Spotify/Apple Music *embed* URL here (e.g. from Spotify's "Share > Embed playlist").
  // Left empty on purpose — Playlist.astro shows a placeholder card until this is filled in.
  playlistEmbedUrl: 'https://open.spotify.com/embed/track/29XFSl6gbJOuE9QBG9lAiD?utm_source=generator&si=0ffc5ee716074a23',
};

export const ACTIVE_ART_MODULE_ID = 'organic-tessellation';

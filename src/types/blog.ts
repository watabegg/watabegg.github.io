export type BlendItem =
	| {
			kind: 'local'
			slug: string
			title: string
			description: string
			author: string
			publishDate: Date
			tags?: string[]
	  }
	| { kind: 'qiita'; title: string; url: string; createdAt: Date }
	| { kind: 'zenn'; title: string; url: string; createdAt: Date }

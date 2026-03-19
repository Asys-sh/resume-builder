export interface PdfTemplateConfig {
  layout: 'single-column' | 'sidebar'
  sidebarPosition?: 'left' | 'right'
  colors: {
    primary: string
    text: string
    subtext: string
    background: string
    sidebarBackground?: string
    sidebarText?: string
  }
  fonts: {
    body: string
    heading: string
  }
  spacing: {
    margin: number
    gap: number
  }
  styles: {
    header: any
    sectionTitle: any
    role: any
    company: any
    date: any
    description: any
  }
}

export const PDF_TEMPLATES: Record<string, PdfTemplateConfig> = {
  modern: {
    layout: 'single-column',
    colors: {
      primary: '#d4a373', // Earthy Tan
      text: '#3a3226',
      subtext: '#6f6454',
      background: '#FFFFFF',
    },
    fonts: {
      body: 'Helvetica',
      heading: 'Helvetica-Bold',
    },
    spacing: {
      margin: 40,
      gap: 20,
    },
    styles: {
      header: {
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#ccd5ae',
        paddingBottom: 15,
        marginBottom: 20,
      },
      sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#d4a373',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#ccd5ae',
        paddingBottom: 4,
        marginBottom: 10,
      },
      role: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#3a3226',
      },
      company: {
        fontSize: 10,
        color: '#6f6454',
      },
      date: {
        fontSize: 9,
        color: '#6f6454',
      },
      description: {
        fontSize: 10,
        color: '#3a3226',
        lineHeight: 1.5,
      },
    },
  },
  classic: {
    layout: 'single-column',
    colors: {
      primary: '#3a3226',
      text: '#3a3226',
      subtext: '#6f6454',
      background: '#FFFFFF',
    },
    fonts: {
      body: 'Times-Roman',
      heading: 'Times-Bold',
    },
    spacing: {
      margin: 40,
      gap: 20,
    },
    styles: {
      header: {
        textAlign: 'left',
        borderBottomWidth: 1,
        borderBottomColor: '#3a3226',
        paddingBottom: 15,
        marginBottom: 20,
      },
      sectionTitle: {
        fontSize: 12,
        fontFamily: 'Times-Bold',
        color: '#3a3226',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#ccd5ae',
        paddingBottom: 4,
        marginBottom: 10,
      },
      role: {
        fontSize: 11,
        fontFamily: 'Times-Bold',
        color: '#3a3226',
      },
      company: {
        fontSize: 10,
        fontFamily: 'Times-Italic',
        color: '#6f6454',
      },
      date: {
        fontSize: 9,
        color: '#6f6454',
      },
      description: {
        fontSize: 10,
        fontFamily: 'Times-Roman',
        color: '#3a3226',
        lineHeight: 1.5,
      },
    },
  },
  minimalist: {
    layout: 'single-column',
    colors: {
      primary: '#3a3226',
      text: '#3a3226',
      subtext: '#6f6454',
      background: '#FFFFFF',
    },
    fonts: {
      body: 'Helvetica',
      heading: 'Helvetica-Bold',
    },
    spacing: {
      margin: 40,
      gap: 20,
    },
    styles: {
      header: {
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ccd5ae',
        paddingBottom: 15,
        marginBottom: 20,
      },
      sectionTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#3a3226',
        textTransform: 'uppercase',
        marginBottom: 10,
      },
      role: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#3a3226',
      },
      company: {
        fontSize: 10,
        color: '#6f6454',
      },
      date: {
        fontSize: 9,
        color: '#6f6454',
      },
      description: {
        fontSize: 10,
        color: '#3a3226',
        lineHeight: 1.4,
      },
    },
  },
  creative: {
    layout: 'sidebar',
    sidebarPosition: 'left',
    colors: {
      primary: '#d4a373',
      text: '#3a3226',
      subtext: '#6f6454',
      background: '#FFFFFF',
      sidebarBackground: '#d4a373',
      sidebarText: '#FFFFFF',
    },
    fonts: {
      body: 'Helvetica',
      heading: 'Helvetica-Bold',
    },
    spacing: {
      margin: 0, // Sidebar layout handles its own padding
      gap: 20,
    },
    styles: {
      header: {
        textAlign: 'left',
        marginBottom: 20,
        color: '#FFFFFF',
      },
      sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#d4a373',
        textTransform: 'uppercase',
        borderBottomWidth: 2,
        borderBottomColor: '#d4a373',
        paddingBottom: 4,
        marginBottom: 10,
      },
      role: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: '#3a3226',
      },
      company: {
        fontSize: 10,
        color: '#6f6454',
      },
      date: {
        fontSize: 9,
        color: '#6f6454',
      },
      description: {
        fontSize: 10,
        color: '#3a3226',
        lineHeight: 1.5,
      },
    },
  },
}

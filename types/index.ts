export interface NpmPackage {
  _id: string;
  _rev: string;
  name: string;
  description?: string;
  maintainers?: Array<{
    name?: string;
    email?: string;
  }>;
  'dist-tags': {
    latest: string;
    [key: string]: string;
  };
  versions: {
    [version: string]: {
      name: string;
      version: string;
      description?: string;
      license?: string;
      homepage?: string;
      keywords?: string[];
      repository?: {
        url?: string;
        type?: string;
      };
      dist: {
        fileCount?: number;
        unpackedSize: number;
        tarball: string;
      };
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      bundledDependencies?: string[];
    };
  };
  time: {
    [version: string]: string;
  };
}

export interface DownloadData {
  downloads: number;
  day: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: (number | string)[];
    borderColor?: string | string[];
    backgroundColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface MainPageCardData {
  title: string;
  value: string | number | undefined;
}
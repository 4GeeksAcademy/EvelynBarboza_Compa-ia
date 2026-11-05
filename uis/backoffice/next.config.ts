import type {
  NextConfig
} from "next";


const nextConfig: NextConfig = {
  basePath: "/backoffice",

  async rewrites() {

    return [

      {
        source: "/backoffice/inventory/:path*",
        destination: "/inventory/:path*",
      },

      {
        source:
          "/backend/:path*",

        destination:
          (
            `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/:path*`
          ),
      },

      {
        source:
          "/auth-backend/:path*",

        destination:
          (
            `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/:path*`
          ),
      },

    ];

  },

};


export default nextConfig;

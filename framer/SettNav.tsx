// Sett Nav — the site menu: logo, a pill bar of links, and the two buttons.
// Any link can have a dropdown of pills under it (hover, focus or tap to open);
// by default "Over ons" has one with "In de media" and "Partners".
// Below 900px it folds into a menu button with a full-screen sheet.
//
// Dropdown items are one per line in the property panel: "Label | /link".
// The current page's link is highlighted automatically (or pick it by hand).

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import * as Framer from "framer"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { CookieBanner } from "./SettCookies.tsx"
import { SettFonts } from "./SettFonts.tsx"

type Img = { src?: string; srcSet?: string; alt?: string } | undefined
type Item = { label?: string; link?: string; dropdown?: string }
interface Props {
    logo?: Img
    logoLink?: string
    showTagline?: boolean
    logoColor?: string
    items?: Item[]
    primary?: string
    primaryLink?: string
    secondary?: string
    secondaryLink?: string
    theme?: "auto" | "light" | "dark"
    active?: string
    primaryColor?: string
    primaryText?: string
    secondaryColor?: string
    secondaryText?: string
    side?: number
    cookies?: boolean
    hideOnScroll?: "mobile" | "always" | "never"
    style?: React.CSSProperties
}

// the Sett logo, as on sett.nl: the wordmark (y 0–51) and the tagline under it (y 54–64)
// the Sett logo with its tagline (one path), also used by the footer
export const LOGO_D = "M 122.515 63.632 L 122.515 55.211 L 124.689 55.211 L 124.689 63.632 Z M 121.166 59.44 L 121.166 57.673 L 130 57.673 L 130 59.44 Z M 126.476 63.632 L 126.476 55.211 L 128.65 55.211 L 128.65 63.632 Z M 118.095 63.767 C 117.412 63.767 116.808 63.637 116.283 63.377 C 115.759 63.108 115.346 62.739 115.046 62.267 C 114.746 61.796 114.596 61.256 114.596 60.647 C 114.596 60.045 114.742 59.513 115.034 59.05 C 115.32 58.583 115.73 58.2 116.221 57.941 C 116.729 57.665 117.3 57.527 117.933 57.527 C 118.549 57.527 119.095 57.657 119.57 57.917 C 120.053 58.168 120.428 58.522 120.694 58.977 C 120.969 59.424 121.107 59.936 121.107 60.512 C 121.107 60.634 121.098 60.76 121.082 60.89 C 121.07 61.034 121.044 61.177 121.007 61.317 L 115.621 61.341 L 115.621 59.976 L 120.145 59.94 L 119.17 60.537 C 119.162 60.204 119.112 59.932 119.02 59.72 C 118.928 59.501 118.795 59.334 118.62 59.221 C 118.445 59.107 118.224 59.05 117.958 59.05 C 117.683 59.05 117.445 59.115 117.245 59.245 C 117.046 59.375 116.891 59.558 116.783 59.793 C 116.675 60.029 116.621 60.313 116.621 60.647 C 116.621 60.988 116.679 61.28 116.796 61.524 C 116.912 61.76 117.079 61.938 117.295 62.06 C 117.512 62.182 117.779 62.243 118.095 62.243 C 118.395 62.243 118.658 62.194 118.883 62.097 C 119.116 61.999 119.324 61.849 119.507 61.646 L 120.644 62.755 C 120.344 63.088 119.967 63.347 119.545 63.511 C 119.12 63.681 118.637 63.767 118.095 63.767 Z M 111.701 63.803 C 111.325 63.803 110.951 63.754 110.589 63.657 C 110.238 63.562 109.899 63.432 109.577 63.267 C 109.268 63.096 109.006 62.901 108.79 62.682 L 109.977 61.5 C 110.178 61.704 110.421 61.866 110.689 61.975 C 110.974 62.089 111.28 62.147 111.589 62.146 C 111.772 62.146 111.909 62.121 112.001 62.072 C 112.101 62.024 112.151 61.955 112.151 61.865 C 112.151 61.735 112.08 61.638 111.938 61.573 C 111.805 61.5 111.626 61.439 111.401 61.39 C 111.171 61.329 110.942 61.264 110.714 61.195 C 110.47 61.113 110.236 61.007 110.014 60.878 C 109.789 60.748 109.606 60.565 109.464 60.33 C 109.331 60.094 109.264 59.793 109.264 59.428 C 109.264 59.046 109.368 58.713 109.577 58.428 C 109.793 58.136 110.093 57.909 110.477 57.746 C 110.86 57.575 111.31 57.49 111.826 57.49 C 112.351 57.49 112.851 57.579 113.326 57.758 C 113.8 57.929 114.184 58.189 114.475 58.538 L 113.276 59.72 C 113.076 59.501 112.855 59.351 112.613 59.269 C 112.372 59.18 112.151 59.135 111.951 59.135 C 111.759 59.135 111.622 59.164 111.539 59.221 C 111.455 59.269 111.414 59.338 111.414 59.428 C 111.414 59.533 111.48 59.619 111.614 59.684 C 111.755 59.749 111.934 59.81 112.151 59.867 C 112.376 59.915 112.605 59.98 112.838 60.062 C 113.08 60.143 113.309 60.257 113.526 60.403 C 113.751 60.542 113.936 60.735 114.063 60.963 C 114.204 61.199 114.275 61.504 114.275 61.877 C 114.275 62.471 114.042 62.942 113.576 63.291 C 113.109 63.632 112.484 63.803 111.701 63.803 Z M 104.117 63.632 L 104.117 54.748 L 106.291 54.748 L 106.291 63.632 Z M 100.913 63.632 L 100.913 54.748 L 103.088 54.748 L 103.088 63.632 Z M 96.183 63.754 C 95.617 63.754 95.113 63.62 94.671 63.352 C 94.23 63.084 93.884 62.718 93.634 62.255 C 93.384 61.784 93.259 61.252 93.259 60.659 C 93.259 60.058 93.384 59.521 93.634 59.05 C 93.884 58.579 94.23 58.213 94.671 57.953 C 95.113 57.685 95.617 57.551 96.183 57.551 C 96.566 57.551 96.916 57.62 97.233 57.758 C 97.55 57.888 97.808 58.075 98.008 58.319 C 98.212 58.554 98.342 58.842 98.383 59.147 L 98.383 62.146 C 98.344 62.455 98.214 62.748 98.008 62.987 C 97.808 63.222 97.55 63.409 97.233 63.547 C 96.916 63.685 96.566 63.754 96.183 63.754 Z M 96.646 61.865 C 97.004 61.865 97.291 61.752 97.508 61.524 C 97.733 61.297 97.845 61.004 97.845 60.647 C 97.845 60.411 97.795 60.204 97.695 60.025 C 97.596 59.847 97.449 59.7 97.27 59.598 C 97.095 59.493 96.891 59.44 96.658 59.44 C 96.425 59.44 96.217 59.493 96.033 59.598 C 95.856 59.707 95.709 59.858 95.608 60.037 C 95.509 60.216 95.459 60.419 95.459 60.647 C 95.459 60.882 95.509 61.093 95.608 61.28 C 95.708 61.459 95.85 61.601 96.033 61.707 C 96.217 61.813 96.421 61.865 96.646 61.865 Z M 97.758 63.632 L 97.758 62.036 L 98.07 60.573 L 97.758 59.135 L 97.758 57.673 L 99.894 57.673 L 99.894 63.632 Z M 87.995 63.767 C 87.312 63.767 86.708 63.637 86.183 63.377 C 85.658 63.108 85.246 62.739 84.946 62.267 C 84.646 61.796 84.496 61.256 84.496 60.647 C 84.496 60.045 84.642 59.513 84.934 59.05 C 85.22 58.583 85.63 58.2 86.12 57.941 C 86.629 57.665 87.2 57.527 87.833 57.527 C 88.449 57.527 88.995 57.657 89.469 57.917 C 89.953 58.168 90.328 58.522 90.594 58.977 C 90.869 59.424 91.006 59.936 91.006 60.512 C 91.006 60.634 90.998 60.76 90.981 60.89 C 90.973 61.012 90.948 61.154 90.907 61.317 L 85.521 61.341 L 85.521 59.976 L 90.044 59.94 L 89.069 60.537 C 89.061 60.204 89.011 59.932 88.92 59.72 C 88.828 59.501 88.695 59.334 88.52 59.221 C 88.345 59.107 88.124 59.05 87.858 59.05 C 87.583 59.05 87.345 59.115 87.145 59.245 C 86.945 59.375 86.791 59.558 86.683 59.793 C 86.575 60.029 86.52 60.313 86.52 60.647 C 86.52 60.988 86.579 61.28 86.695 61.524 C 86.812 61.76 86.979 61.938 87.195 62.06 C 87.412 62.182 87.678 62.243 87.995 62.243 C 88.295 62.243 88.557 62.194 88.782 62.097 C 89.015 61.999 89.224 61.849 89.407 61.646 L 90.544 62.755 C 90.244 63.088 89.867 63.347 89.444 63.511 C 89.019 63.681 88.536 63.767 87.995 63.767 Z M 81.705 63.632 L 81.705 57.673 L 83.892 57.673 L 83.892 63.632 Z M 82.792 56.978 C 82.467 56.978 82.196 56.873 81.98 56.661 C 81.763 56.442 81.655 56.17 81.655 55.845 C 81.655 55.528 81.763 55.26 81.98 55.04 C 82.196 54.821 82.467 54.711 82.792 54.711 C 83.133 54.711 83.408 54.821 83.617 55.04 C 83.833 55.26 83.942 55.528 83.942 55.845 C 83.942 56.17 83.833 56.442 83.617 56.661 C 83.408 56.873 83.133 56.978 82.792 56.978 Z M 77.679 63.632 L 77.679 55.211 L 79.853 55.211 L 79.853 63.632 Z M 76.329 59.44 L 76.329 57.673 L 81.203 57.673 L 81.203 59.44 Z M 73.638 63.632 L 73.638 57.673 L 75.825 57.673 L 75.825 63.632 Z M 74.725 56.978 C 74.4 56.978 74.13 56.873 73.913 56.661 C 73.696 56.442 73.588 56.17 73.588 55.845 C 73.588 55.528 73.696 55.26 73.913 55.04 C 74.13 54.821 74.4 54.711 74.725 54.711 C 75.067 54.711 75.342 54.821 75.55 55.04 C 75.767 55.26 75.875 55.528 75.875 55.845 C 75.875 56.17 75.767 56.442 75.55 56.661 C 75.342 56.873 75.067 56.978 74.725 56.978 Z M 70.343 63.803 C 69.968 63.803 69.597 63.754 69.231 63.657 C 68.88 63.562 68.541 63.431 68.218 63.267 C 67.91 63.096 67.648 62.901 67.431 62.682 L 68.618 61.5 C 68.82 61.704 69.062 61.866 69.331 61.975 C 69.616 62.089 69.922 62.147 70.23 62.146 C 70.414 62.146 70.551 62.121 70.643 62.072 C 70.743 62.024 70.793 61.955 70.793 61.865 C 70.793 61.735 70.722 61.638 70.58 61.573 C 70.447 61.5 70.268 61.439 70.043 61.39 C 69.813 61.329 69.583 61.264 69.356 61.195 C 69.112 61.113 68.878 61.007 68.656 60.878 C 68.431 60.748 68.248 60.565 68.106 60.33 C 67.973 60.094 67.906 59.793 67.906 59.428 C 67.906 59.046 68.01 58.713 68.218 58.428 C 68.435 58.136 68.735 57.909 69.118 57.746 C 69.502 57.575 69.951 57.49 70.468 57.49 C 70.993 57.49 71.492 57.579 71.967 57.758 C 72.442 57.929 72.825 58.189 73.117 58.538 L 71.917 59.72 C 71.717 59.501 71.497 59.351 71.255 59.269 C 71.013 59.18 70.793 59.135 70.593 59.135 C 70.401 59.135 70.264 59.164 70.18 59.221 C 70.097 59.269 70.056 59.338 70.056 59.428 C 70.056 59.533 70.122 59.619 70.255 59.684 C 70.397 59.749 70.576 59.81 70.793 59.867 C 71.018 59.915 71.247 59.98 71.48 60.062 C 71.722 60.143 71.951 60.257 72.167 60.403 C 72.393 60.542 72.578 60.735 72.705 60.963 C 72.846 61.199 72.917 61.504 72.917 61.877 C 72.917 62.471 72.684 62.942 72.217 63.291 C 71.751 63.632 71.126 63.803 70.343 63.803 Z M 64.945 63.632 L 64.945 60.269 C 64.945 59.992 64.861 59.777 64.695 59.623 C 64.528 59.46 64.316 59.379 64.057 59.379 C 63.882 59.379 63.724 59.416 63.582 59.489 C 63.451 59.56 63.343 59.665 63.27 59.793 C 63.195 59.923 63.158 60.082 63.158 60.269 L 62.308 59.879 C 62.308 59.399 62.416 58.989 62.633 58.648 C 62.844 58.303 63.152 58.024 63.52 57.843 C 63.903 57.648 64.337 57.551 64.82 57.551 C 65.261 57.551 65.653 57.652 65.994 57.856 C 66.337 58.043 66.621 58.317 66.819 58.648 C 67.019 58.981 67.119 59.359 67.119 59.781 L 67.119 63.632 Z M 60.983 63.632 L 60.983 57.673 L 63.158 57.673 L 63.158 63.632 Z M 56.253 63.754 C 55.687 63.754 55.183 63.62 54.741 63.352 C 54.3 63.084 53.954 62.718 53.704 62.255 C 53.454 61.784 53.329 61.252 53.329 60.659 C 53.329 60.058 53.454 59.521 53.704 59.05 C 53.954 58.579 54.3 58.213 54.741 57.953 C 55.183 57.685 55.687 57.551 56.253 57.551 C 56.636 57.551 56.986 57.62 57.303 57.758 C 57.62 57.888 57.878 58.075 58.078 58.319 C 58.282 58.554 58.412 58.842 58.453 59.147 L 58.453 62.146 C 58.414 62.455 58.284 62.748 58.078 62.987 C 57.878 63.222 57.62 63.409 57.303 63.547 C 56.986 63.685 56.636 63.754 56.253 63.754 Z M 56.715 61.865 C 57.074 61.865 57.361 61.752 57.578 61.524 C 57.803 61.297 57.915 61.004 57.915 60.647 C 57.915 60.411 57.865 60.204 57.765 60.025 C 57.666 59.847 57.519 59.7 57.34 59.598 C 57.165 59.493 56.961 59.44 56.728 59.44 C 56.495 59.44 56.286 59.493 56.103 59.598 C 55.926 59.707 55.779 59.858 55.678 60.037 C 55.578 60.216 55.528 60.419 55.528 60.647 C 55.528 60.882 55.578 61.093 55.678 61.28 C 55.778 61.459 55.92 61.601 56.103 61.707 C 56.286 61.813 56.491 61.865 56.715 61.865 Z M 57.828 63.632 L 57.828 62.036 L 58.14 60.573 L 57.828 59.135 L 57.828 57.673 L 59.964 57.673 L 59.964 63.632 Z M 48.67 63.632 L 48.67 57.673 L 50.844 57.673 L 50.844 63.632 Z M 50.844 60.391 L 49.87 59.586 C 50.111 58.912 50.432 58.404 50.832 58.063 C 51.232 57.722 51.753 57.551 52.394 57.551 C 52.685 57.551 52.935 57.587 53.144 57.661 C 53.353 57.729 53.541 57.846 53.693 58.002 L 52.431 59.647 C 52.365 59.574 52.269 59.517 52.144 59.477 C 52.027 59.428 51.894 59.403 51.744 59.403 C 51.461 59.403 51.24 59.489 51.082 59.659 C 50.923 59.822 50.844 60.066 50.844 60.391 Z M 44.632 63.632 L 44.632 55.211 L 46.806 55.211 L 46.806 63.632 Z M 43.283 59.44 L 43.283 57.673 L 48.156 57.673 L 48.156 59.44 Z M 40.334 63.767 C 39.651 63.767 39.047 63.637 38.522 63.377 C 37.998 63.108 37.585 62.739 37.285 62.267 C 36.985 61.796 36.835 61.256 36.835 60.647 C 36.835 60.045 36.981 59.513 37.273 59.05 C 37.559 58.583 37.969 58.2 38.46 57.941 C 38.968 57.665 39.539 57.527 40.172 57.527 C 40.788 57.527 41.334 57.657 41.809 57.917 C 42.292 58.168 42.667 58.522 42.933 58.977 C 43.208 59.424 43.346 59.936 43.346 60.512 C 43.346 60.634 43.337 60.76 43.321 60.89 C 43.308 61.034 43.283 61.177 43.246 61.317 L 37.86 61.341 L 37.86 59.976 L 42.383 59.94 L 41.409 60.537 C 41.401 60.204 41.351 59.932 41.259 59.72 C 41.167 59.501 41.034 59.334 40.859 59.221 C 40.684 59.107 40.463 59.05 40.197 59.05 C 39.922 59.05 39.684 59.115 39.484 59.245 C 39.284 59.375 39.13 59.558 39.022 59.793 C 38.914 60.029 38.86 60.313 38.86 60.647 C 38.86 60.988 38.918 61.28 39.035 61.524 C 39.151 61.76 39.318 61.938 39.534 62.06 C 39.751 62.182 40.017 62.243 40.334 62.243 C 40.634 62.243 40.897 62.194 41.122 62.097 C 41.355 61.999 41.563 61.849 41.746 61.646 L 42.883 62.755 C 42.583 63.088 42.206 63.347 41.784 63.511 C 41.359 63.681 40.876 63.767 40.334 63.767 Z M 34.044 63.632 L 34.044 57.673 L 36.231 57.673 L 36.231 63.632 Z M 35.131 56.978 C 34.806 56.978 34.535 56.873 34.319 56.661 C 34.102 56.442 33.994 56.17 33.994 55.845 C 33.994 55.528 34.102 55.26 34.319 55.04 C 34.535 54.821 34.806 54.711 35.131 54.711 C 35.473 54.711 35.747 54.821 35.956 55.04 C 36.172 55.26 36.281 55.528 36.281 55.845 C 36.281 56.17 36.172 56.442 35.956 56.661 C 35.747 56.873 35.473 56.978 35.131 56.978 Z M 29.559 66.338 C 28.884 66.338 28.285 66.224 27.76 65.997 C 27.243 65.777 26.839 65.465 26.548 65.058 L 27.86 63.791 C 28.068 64.01 28.297 64.181 28.547 64.303 C 28.797 64.433 29.101 64.498 29.459 64.498 C 29.893 64.498 30.234 64.392 30.484 64.181 C 30.742 63.978 30.871 63.681 30.871 63.291 L 30.871 61.743 L 31.221 60.452 L 30.909 59.172 L 30.909 57.673 L 33.046 57.673 L 33.046 63.218 C 33.046 63.852 32.892 64.4 32.583 64.863 C 32.283 65.335 31.871 65.696 31.346 65.948 C 30.821 66.208 30.226 66.338 29.559 66.338 Z M 29.459 63.413 C 28.893 63.413 28.389 63.287 27.947 63.035 C 27.514 62.775 27.173 62.422 26.923 61.975 C 26.673 61.528 26.548 61.029 26.548 60.476 C 26.548 59.923 26.673 59.428 26.923 58.989 C 27.165 58.558 27.518 58.197 27.947 57.941 C 28.389 57.681 28.893 57.551 29.459 57.551 C 29.843 57.551 30.192 57.62 30.509 57.758 C 30.834 57.888 31.096 58.075 31.296 58.319 C 31.496 58.554 31.621 58.831 31.671 59.147 L 31.671 61.817 C 31.624 62.126 31.49 62.418 31.284 62.657 C 31.084 62.893 30.826 63.08 30.509 63.218 C 30.192 63.348 29.843 63.413 29.459 63.413 Z M 29.859 61.573 C 30.093 61.573 30.292 61.524 30.459 61.427 C 30.634 61.321 30.767 61.187 30.859 61.024 C 30.95 60.855 30.997 60.667 30.996 60.476 C 30.996 60.273 30.95 60.09 30.859 59.927 C 30.768 59.766 30.634 59.631 30.471 59.537 C 30.305 59.432 30.105 59.379 29.872 59.379 C 29.647 59.379 29.447 59.432 29.272 59.537 C 29.107 59.633 28.972 59.773 28.884 59.94 C 28.792 60.104 28.745 60.289 28.747 60.476 C 28.747 60.663 28.793 60.842 28.884 61.012 C 28.977 61.176 29.11 61.314 29.272 61.414 C 29.438 61.52 29.634 61.573 29.859 61.573 Z M 21.926 63.632 L 21.926 57.673 L 24.101 57.673 L 24.101 63.632 Z M 24.101 60.391 L 23.126 59.586 C 23.367 58.912 23.688 58.404 24.088 58.063 C 24.488 57.722 25.008 57.551 25.65 57.551 C 25.941 57.551 26.191 57.587 26.4 57.661 C 26.609 57.729 26.798 57.846 26.95 58.002 L 25.687 59.647 C 25.621 59.574 25.525 59.517 25.4 59.477 C 25.283 59.428 25.15 59.403 25 59.403 C 24.717 59.403 24.496 59.489 24.338 59.659 C 24.18 59.822 24.101 60.066 24.101 60.391 Z M 18.343 63.767 C 17.66 63.767 17.056 63.637 16.532 63.377 C 16.007 63.108 15.594 62.739 15.294 62.267 C 14.995 61.796 14.845 61.256 14.845 60.647 C 14.845 60.045 14.99 59.513 15.282 59.05 C 15.569 58.583 15.979 58.2 16.469 57.941 C 16.977 57.665 17.548 57.527 18.181 57.527 C 18.797 57.527 19.343 57.657 19.818 57.917 C 20.301 58.168 20.676 58.522 20.943 58.977 C 21.217 59.424 21.355 59.936 21.355 60.512 C 21.355 60.634 21.347 60.76 21.33 60.89 C 21.318 61.034 21.293 61.177 21.255 61.317 L 15.87 61.341 L 15.87 59.976 L 20.393 59.94 L 19.418 60.537 C 19.41 60.204 19.36 59.932 19.268 59.72 C 19.177 59.501 19.043 59.334 18.868 59.221 C 18.693 59.107 18.473 59.05 18.206 59.05 C 17.931 59.05 17.694 59.115 17.494 59.245 C 17.294 59.375 17.14 59.558 17.031 59.793 C 16.923 60.029 16.869 60.313 16.869 60.647 C 16.869 60.988 16.927 61.28 17.044 61.524 C 17.161 61.76 17.327 61.938 17.544 62.06 C 17.76 62.182 18.027 62.243 18.343 62.243 C 18.643 62.243 18.906 62.194 19.131 62.097 C 19.364 61.999 19.572 61.849 19.756 61.646 L 20.893 62.755 C 20.593 63.088 20.216 63.347 19.793 63.511 C 19.368 63.681 18.885 63.767 18.343 63.767 Z M 12.183 63.632 L 12.183 60.269 C 12.183 59.992 12.1 59.777 11.933 59.623 C 11.766 59.46 11.554 59.379 11.296 59.379 C 11.121 59.379 10.962 59.416 10.821 59.489 C 10.689 59.56 10.581 59.665 10.508 59.793 C 10.433 59.923 10.396 60.082 10.396 60.269 L 9.546 59.879 C 9.546 59.399 9.655 58.989 9.871 58.648 C 10.083 58.303 10.39 58.024 10.758 57.843 C 11.142 57.648 11.575 57.551 12.058 57.551 C 12.499 57.551 12.891 57.652 13.232 57.856 C 13.575 58.043 13.86 58.317 14.057 58.648 C 14.257 58.981 14.357 59.359 14.357 59.781 L 14.357 63.632 Z M 8.222 63.632 L 8.222 57.673 L 10.396 57.673 L 10.396 63.632 Z M 0.787 63.632 L 0.787 54.992 L 3.024 54.992 L 3.024 63.632 Z M 2.562 63.632 L 2.562 61.792 L 7.36 61.792 L 7.36 63.632 Z M 2.562 60.122 L 2.562 58.331 L 6.91 58.331 L 6.91 60.122 L 2.561 60.122 Z M 2.562 56.832 L 2.562 54.992 L 7.285 54.992 L 7.285 56.832 Z M 92.792 26.272 C 91.91 28.005 93.203 30.036 95.186 30.036 L 100.762 30.036 C 101.769 30.037 102.545 30.901 102.416 31.875 L 100.348 48.327 C 100.24 49.139 99.531 49.746 98.692 49.746 L 87.133 49.746 C 86.69 49.746 86.265 49.575 85.952 49.269 C 85.638 48.963 85.462 48.549 85.462 48.117 L 85.462 27.578 C 85.462 26.678 84.714 25.949 83.792 25.949 L 79.414 25.949 C 78.491 25.948 77.744 25.219 77.743 24.319 L 77.743 16.11 C 77.744 15.21 78.491 14.481 79.414 14.481 L 83.792 14.481 C 84.714 14.481 85.462 13.751 85.462 12.852 L 85.462 1.629 C 85.462 0.729 86.21 0 87.133 0 L 101.056 0 C 102.296 0 103.103 1.271 102.552 2.354 Z M 120.221 0 C 120.664 0 121.089 0.172 121.403 0.477 C 121.716 0.783 121.892 1.197 121.892 1.629 L 121.892 12.852 C 121.892 13.751 122.64 14.481 123.562 14.481 L 127.941 14.481 C 128.863 14.481 129.611 15.211 129.611 16.11 L 129.611 24.319 C 129.61 25.219 128.863 25.948 127.941 25.949 L 123.562 25.949 C 122.64 25.949 121.892 26.678 121.892 27.578 L 121.892 48.117 C 121.892 48.549 121.716 48.963 121.403 49.269 C 121.089 49.575 120.664 49.746 120.221 49.746 L 107.742 49.746 C 106.524 49.746 105.715 48.515 106.225 47.435 L 114.735 24.212 C 115.55 22.485 114.257 20.516 112.308 20.515 L 106.631 20.515 C 105.608 20.515 104.825 19.624 104.98 18.637 L 107.549 1.382 C 107.674 0.587 108.375 0 109.2 0 Z M 57.334 50.607 C 53.121 50.607 49.421 49.843 46.237 48.313 C 43.052 46.736 40.553 44.562 38.74 41.79 C 36.976 38.971 36.094 35.745 36.094 32.113 C 36.094 28.529 36.951 25.351 38.667 22.579 C 40.43 19.808 42.831 17.633 45.869 16.056 C 48.907 14.432 52.337 13.619 56.159 13.619 C 59.931 13.619 63.263 14.384 66.154 15.913 C 69.045 17.394 71.299 19.473 72.916 22.15 C 74.581 24.825 75.414 27.884 75.414 31.325 C 75.414 32.041 75.366 32.806 75.267 33.619 C 75.239 34.057 75.179 34.543 75.086 35.076 C 74.957 35.822 74.278 36.346 73.502 36.351 L 43.876 36.547 C 43.431 36.549 43.003 36.379 42.687 36.073 C 42.372 35.767 42.194 35.351 42.194 34.917 L 42.194 29.572 C 42.194 28.677 42.934 27.95 43.851 27.943 L 64.168 27.782 C 65.61 27.771 66.133 29.631 64.887 30.339 C 63.95 30.871 62.769 30.208 62.622 29.16 C 62.501 28.293 62.306 27.533 62.038 26.88 C 61.597 25.638 60.911 24.706 59.98 24.085 C 59.049 23.463 57.873 23.153 56.452 23.153 C 54.983 23.153 53.708 23.511 52.631 24.228 C 51.553 24.945 50.72 25.972 50.132 27.311 C 49.593 28.649 49.323 30.273 49.323 32.185 C 49.323 34.144 49.617 35.793 50.205 37.131 C 50.842 38.421 51.749 39.401 52.925 40.07 C 54.101 40.739 55.571 41.074 57.334 41.074 C 59.049 41.074 60.544 40.811 61.818 40.285 C 62.646 39.926 63.426 39.446 64.157 38.843 C 64.892 38.239 65.995 38.189 66.678 38.848 L 71.501 43.505 C 72.13 44.112 72.17 45.099 71.529 45.694 C 69.952 47.156 68.136 48.292 66.08 49.102 C 63.533 50.105 60.617 50.607 57.334 50.607 Z M 17.253 50.822 C 14.999 50.822 12.746 50.536 10.492 49.962 C 8.238 49.389 6.131 48.6 4.171 47.597 C 2.811 46.882 1.6 46.096 0.538 45.236 C -0.165 44.667 -0.169 43.643 0.468 43.004 L 5.709 37.743 C 6.359 37.091 7.424 37.093 8.166 37.644 C 9.041 38.294 10.012 38.84 11.079 39.282 C 12.746 39.95 14.485 40.285 16.298 40.285 C 17.131 40.285 17.768 40.189 18.209 39.998 C 18.699 39.759 18.944 39.449 18.944 39.067 C 18.944 38.397 18.527 37.896 17.694 37.561 C 16.91 37.227 15.881 36.916 14.607 36.629 C 13.382 36.342 12.06 35.984 10.639 35.554 C 9.253 35.07 7.922 34.445 6.67 33.69 C 5.396 32.878 4.367 31.779 3.583 30.393 C 2.799 28.959 2.407 27.143 2.407 24.945 C 2.407 22.699 3.044 20.716 4.318 18.996 C 5.641 17.227 7.478 15.841 9.83 14.838 C 12.231 13.787 14.999 13.261 18.135 13.261 C 21.32 13.261 24.407 13.787 27.396 14.838 C 29.849 15.701 31.89 16.918 33.518 18.489 C 34.123 19.074 34.073 20.018 33.476 20.611 L 28.131 25.925 C 27.454 26.597 26.346 26.556 25.595 25.964 C 24.729 25.282 23.811 24.799 22.839 24.515 C 21.369 24.037 20.144 23.798 19.164 23.798 C 18.233 23.798 17.572 23.942 17.18 24.228 C 16.837 24.467 16.665 24.778 16.665 25.16 C 16.665 25.686 17.057 26.116 17.841 26.451 C 18.625 26.785 19.63 27.096 20.855 27.382 C 22.128 27.669 23.451 28.051 24.823 28.529 C 26.195 29.007 27.494 29.676 28.719 30.536 C 29.993 31.396 31.022 32.543 31.805 33.977 C 32.589 35.363 32.981 37.179 32.981 39.425 C 32.981 42.913 31.56 45.685 28.719 47.74 C 25.877 49.795 22.055 50.822 17.253 50.822 Z"

const ITEMS: Item[] = [
    { label: "Home", link: "/", dropdown: "" },
    { label: "Wat is Sett?", link: "/details", dropdown: "" },
    { label: "Bedrijven", link: "/bedrijven", dropdown: "" },
    { label: "Particulieren", link: "/particulieren", dropdown: "" },
    { label: "Gemeenten", link: "/gemeenten", dropdown: "" },
    { label: "Over ons", link: "/over", dropdown: "In de media | /in-de-media\nPartners | /partners\nQ&A | /qa" },
    { label: "Blog", link: "/blog", dropdown: "" },
    { label: "Contact", link: "/contact", dropdown: "" },
]
// Framer hands unset text over as "" and an unset colour as its placeholder blue
const unset = (v: unknown) => v === undefined || v === null || v === "" || (typeof v === "string" && /^(#09f|#0099ff|rgba?\(0, ?153, ?255(, ?1)?\))$/i.test(v.trim()))
const or = <T,>(v: T | undefined, d: T): T => (unset(v) ? d : (v as T))
const subs = (s?: string) =>
    (s || "")
        .split(/\n/)
        .map((l) => l.split("|").map((x) => x.trim()))
        .filter((p) => p[0])
        .map(([label, link]) => ({ label, link: link || "#" }))
        // the V2 pages are the standard pages now: old "Nieuwe versie (V2)" items saved in a menu go
        .filter((d) => !/^\/v2-/.test(d.link))
const clean = (u?: string) => (u || "").replace(/\/+$/, "") || "/"

// the breadcrumb trail for search engines (schema.org BreadcrumbList): Home › this page.
// The address comes from Framer's router, so the trail is in the page's HTML from the
// server. Not on the homepage (nothing to trail) and not on blog articles: the article
// writes its own (Home › Blog › title), as only it knows the title
const SITE = "https://www.sett.nl"
const NAMES: Record<string, string> = { "/pre-order": "Bestel jouw Sett", "/bestelling-bevestigd": "Bestelling bevestigd", "/bedankt": "Bedankt", "/roadmap": "Roadmap", "/velsen-zuid": "Velsen-Zuid", "/in-de-media": "In de media" }
type Router = { routes?: Record<string, { path?: string }>; currentRouteId?: string; currentPathVariables?: Record<string, string> } | null
const useRouterSafe: () => Router = ((Framer as unknown as { useRouter?: () => never }).useRouter as never) || (() => null)
function useRoutePath(): string {
    try {
        const r = useRouterSafe()
        const route = r?.currentRouteId ? r.routes?.[r.currentRouteId] : undefined
        if (route?.path) return route.path.replace(/:(\w+)/g, (_m, k: string) => r?.currentPathVariables?.[k] ?? "")
    } catch {
        /* no router here (the canvas, the studio) */
    }
    return ""
}
function crumbs(path: string, items: { label: string; link: string; dropdown: { label: string; link: string }[] }[]) {
    const here = clean(path)
    if (here === "/" || here.split("/").length !== 2) return null
    const named = items.flatMap((it) => [{ label: it.label, link: it.link }, ...it.dropdown]).find((x) => clean(x.link) === here)
    const name = named?.label || NAMES[here] || here.slice(1).replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
            { "@type": "ListItem", position: 2, name, item: SITE + here },
        ],
    }
}

const CSS = `
.sn{ --sn-bar:rgba(246,246,246,.74); --sn-ink:#0B0E1A; --sn-hover:rgba(255,255,255,.7); --sn-pill:#FFFFFF; --sn-pill-ink:#0B0E1A; --sn-shadow:0 8px 24px rgba(11,14,26,.10);
  font-family:"Sett Outfit",Outfit,"Outfit Placeholder",system-ui,sans-serif; -webkit-font-smoothing:antialiased; width:100%; position:relative; z-index:20; color:var(--sn-ink);
  pointer-events:auto; transition:transform .38s cubic-bezier(.2,.8,.2,1); }
/* scrolled away (scrolling down), back as soon as you scroll up */
.sn.away{ transform:translateY(calc(-100% - 16px)); pointer-events:none; }
@media (prefers-reduced-motion: reduce){ .sn{ transition:none; } }
.sn.dark{ --sn-bar:rgba(11,18,36,.62); --sn-ink:#F4F6FB; --sn-hover:rgba(223,228,244,.16); --sn-pill:#F4F6FB; --sn-pill-ink:#0B0E1A; --sn-shadow:0 10px 30px rgba(0,0,0,.35); }
.sn *{ box-sizing:border-box; }
.sn a{ text-decoration:none; }
/* the row is the container the breakpoints measure (the menu's own width, so Framer's
   canvas breakpoints show the right state); the full-screen sheet sits outside it */
.sn-row{ container-type:inline-size; container-name:snrow; position:relative; z-index:20; padding:14px var(--sn-side, 24px); }
/* logo on the left edge, buttons on the right edge, the link bar centred between them */
.sn-in{ display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:18px; }
.sn-in > .sn-logo{ justify-self:start; }
.sn-in > .sn-btns{ justify-self:end; }
.sn-in > .sn-burger{ justify-self:end; }
.sn-ico{ display:block; flex:none; }
.sn .sn-link.home{ gap:8px; }
.sn .sn-link.home .sn-ico{ display:none; }
.sn .sn-logo{ display:block; flex:none; line-height:0; }
.sn-logo img, .sn-logo svg{ display:block; height:60px; width:auto; }
.sn-bar{ display:flex; align-items:center; gap:2px; padding:4px; border-radius:999px; background:var(--sn-bar); box-shadow:inset 0 0 0 1px rgba(128,134,150,.18), 0 6px 24px rgba(6,12,26,.08); backdrop-filter:blur(18px) saturate(1.4); -webkit-backdrop-filter:blur(18px) saturate(1.4); transition:background .35s; }
.sn .sn-link{ transition:background .25s, color .35s; }
.sn-logo path{ transition:fill .35s; }
.sn-item{ position:relative; }
.sn .sn-link{ display:inline-flex; align-items:center; gap:6px; height:38px; padding:0 13px; border-radius:999px; font-weight:600; font-size:clamp(14px, 1vw, 16px); color:var(--sn-ink); white-space:nowrap; transition:background .25s; cursor:pointer; background:none; border:0; font-family:inherit; }
.sn-link:hover, .sn-item.open > .sn-link, .sn-link.on{ background:var(--sn-hover); }
.sn-link .car{ width:6px; height:6px; border-right:2px solid currentColor; border-bottom:2px solid currentColor; transform:translateY(-2px) rotate(45deg); opacity:.45; transition:transform .25s; }
.sn-item.open .car{ transform:translateY(1px) rotate(225deg); }
.sn-drop{ position:absolute; left:-2px; top:100%; padding-top:10px; display:flex; flex-direction:column; align-items:flex-start; gap:8px; opacity:0; visibility:hidden; transform:translateY(-6px); transition:opacity .2s, transform .25s cubic-bezier(.2,.8,.2,1), visibility 0s .25s; }
.sn-item.open .sn-drop{ opacity:1; visibility:visible; transform:none; transition:opacity .2s, transform .25s cubic-bezier(.2,.8,.2,1); }
.sn .sn-pill{ display:inline-flex; align-items:center; gap:10px; height:40px; padding:0 18px; border-radius:999px; background:var(--sn-pill); color:var(--sn-pill-ink); font-weight:600; font-size:clamp(14px, 1vw, 16px); white-space:nowrap; box-shadow:var(--sn-shadow); transition:transform .25s cubic-bezier(.2,.8,.2,1); }
.sn-pill:hover{ transform:translateX(3px); }
.sn-pill .v2{ font:700 10px "Sett Mono","Geist Mono",ui-monospace,monospace; letter-spacing:.08em; padding:4px 7px; border-radius:6px; background:#8DFF66; color:#060C1A; }
.sn-btns{ display:flex; gap:10px; flex:none; }
.sn-btn{ display:inline-flex; align-items:center; gap:10px; height:44px; padding:0 20px; border-radius:999px; font-weight:800; font-size:clamp(14px, 1.05vw, 17px); white-space:nowrap; transition:transform .3s cubic-bezier(.2,.8,.2,1); }
.sn-btn:hover{ transform:translateY(-2px); }
.sn-burger{ display:none; width:44px; height:44px; border-radius:999px; border:0; background:var(--sn-bar); color:var(--sn-ink); cursor:pointer; align-items:center; justify-content:center; }
.sn-burger i{ display:block; width:20px; height:2px; background:currentColor; border-radius:2px; box-shadow:0 -6px 0 currentColor, 0 6px 0 currentColor; }
.sn.menu .sn-burger i{ box-shadow:none; transform:rotate(45deg); }
.sn.menu .sn-burger i::after{ content:""; display:block; width:20px; height:2px; background:currentColor; transform:rotate(90deg); border-radius:2px; }
.sn-sheet{ position:fixed; inset:0; z-index:19; background:var(--sn-sheet, #F6F6F6); padding:104px 22px 32px; overflow:auto; opacity:0; visibility:hidden; transition:opacity .25s, visibility 0s .25s; }
.sn.dark .sn-sheet{ --sn-sheet:#060C1A; }
/* the phone menu's layer, at the end of the page and above everything */
.sn.sn-layer{ position:fixed; top:0; left:0; width:0; height:0; z-index:2147483000; }
.sn-sheet-head{ position:absolute; top:0; left:0; right:0; display:flex; align-items:center; justify-content:space-between; padding:14px var(--sn-side, 24px); }
.sn-sheet-head .sn-logo svg, .sn-sheet-head .sn-logo img{ height:60px; }
.sn .sn-close{ display:inline-flex; }
.sn.menu .sn-sheet{ opacity:1; visibility:visible; transition:opacity .25s; }
.sn-sheet ul{ list-style:none; margin:0; padding:0; }
.sn-sheet > ul > li{ border-bottom:1px solid var(--sn-bar); padding:14px 0; }
.sn .sn-sheet .top{ display:inline-flex; align-items:center; gap:10px; font-weight:800; font-size:24px; letter-spacing:-.02em; color:var(--sn-ink); }
.sn-sheet .top.on{ text-decoration:underline; text-decoration-thickness:3px; text-underline-offset:6px; }
.sn-sheet .sub{ display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
.sn-sheet .sub .sn-pill{ height:38px; padding:0 14px; font-size:15px; }
.sn-sheet .sn-btns{ display:flex; flex-direction:column; gap:10px; margin-top:24px; }
.sn-sheet .sn-btn{ justify-content:center; }
@container snrow (max-width: 1180px){ .sn .sn-link{ padding:0 10px; } .sn-btn{ padding:0 16px; } }
/* in between (1080 px down to the phone layout): Home and the two buttons as icons only */
@container snrow (max-width: 1080px){
  .sn-in .sn-btn{ width:44px; padding:0; justify-content:center; }
  .sn-in .sn-btn .t{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
  .sn .sn-link.home{ padding:0 12px; }
  .sn .sn-link.home .sn-ico{ display:block; }
  .sn .sn-link.home .t{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
}
@container snrow (max-width: 900px){
  .sn-in{ grid-template-columns:1fr auto; }
  .sn-in .sn-bar, .sn-in .sn-btns{ display:none; }
  .sn-in .sn-burger{ display:inline-flex; }
}
/* the sheet only exists on a phone; a menu left open while the window widens closes visually */
@media (min-width: 901px){ .sn-sheet{ display:none; } }
`

const Cart = () => (
    <svg className="sn-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2.5 3h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2L21.2 7H6" />
    </svg>
)
const House = () => (
    <svg className="sn-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3.5 10.5 12 3.5l8.5 7" />
        <path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9" />
    </svg>
)
const Phone = () => (
    <svg className="sn-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
)

const onCanvas = () => {
    try {
        return RenderTarget.current() === RenderTarget.canvas
    } catch {
        return false
    }
}

// the z-index the menu's wrapper gets: above any section, below the mobile menu and dialogs
const TOP = 1000

// pushState/replaceState fire no event, so announce them once for every menu on the page
const LOC_EVENT = "sett:locationchange"
function watchHistory() {
    const h = window.history as History & { __settWatched?: boolean }
    if (h.__settWatched) return
    h.__settWatched = true
    for (const k of ["pushState", "replaceState"] as const) {
        const orig = h[k]
        h[k] = function (this: History, ...args: Parameters<History["pushState"]>) {
            const r = orig.apply(this, args)
            window.dispatchEvent(new Event(LOC_EVENT))
            return r
        } as History["pushState"]
    }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 */
export default function SettNav(props: Props) {
    const p = props
    const items = (p.items && p.items.length ? p.items : ITEMS).map((it, i) => ({
        label: or(it.label, ITEMS[i]?.label ?? "Link"),
        link: or(it.link, ITEMS[i]?.link ?? "#"),
        dropdown: subs(it.dropdown),
    }))
    const [open, setOpen] = useState(-1)
    const [menu, setMenu] = useState(false)
    const [path, setPath] = useState("")
    const routePath = useRoutePath()
    const closeT = useRef<ReturnType<typeof setTimeout> | null>(null)
    const root = useRef<HTMLDivElement>(null)
    // follow the page: Framer keeps the menu mounted between pages, so a link in the
    // content, back/forward or the router must update the highlight too
    useEffect(() => {
        if (typeof window === "undefined") return
        let was = ""
        const sync = () => {
            const now = clean(window.location.pathname)
            if (now === was) return
            if (was) (setOpen(-1), setMenu(false)) // a new page: close what was open
            was = now
            setPath(now)
        }
        sync()
        watchHistory()
        window.addEventListener("popstate", sync)
        window.addEventListener(LOC_EVENT, sync)
        const nav = (window as unknown as { navigation?: EventTarget }).navigation
        nav?.addEventListener?.("navigatesuccess", sync)
        const iv = setInterval(sync, 600) // a router that changes the address some other way
        return () => {
            window.removeEventListener("popstate", sync)
            window.removeEventListener(LOC_EVENT, sync)
            nav?.removeEventListener?.("navigatesuccess", sync)
            clearInterval(iv)
        }
    }, [])
    // always on top: lift the layers the menu sits in (the wrapper it was placed in, with
    // the z-index set in Framer) above the page's sections, also after a page change
    useEffect(() => {
        let n = root.current?.parentElement
        for (; n && n !== document.body; n = n.parentElement) {
            const cs = getComputedStyle(n)
            const z = parseInt(cs.zIndex, 10)
            if (cs.position !== "static" && !isNaN(z) && z < TOP) n.style.zIndex = String(TOP)
            // the wrapper stays in place when the menu scrolls away: let taps through to the page
            if (cs.position === "fixed" || cs.position === "sticky") n.style.pointerEvents = "none"
        }
    }, [path])
    useEffect(() => {
        // close a dropdown on a click elsewhere or Escape
        const off = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(-1)
        const esc = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(-1), setMenu(false))
        document.addEventListener("click", off)
        document.addEventListener("keydown", esc)
        return () => {
            document.removeEventListener("click", off)
            document.removeEventListener("keydown", esc)
        }
    }, [])
    // out of the way while scrolling down (on phones by default, where the logo sits over
    // the text), back as soon as you scroll up; always there at the top and with the menu open
    const [away, setAway] = useState(false)
    useEffect(() => {
        const mode = p.hideOnScroll ?? "mobile"
        if (mode === "never" || typeof window === "undefined" || onCanvas()) return setAway(false)
        let last = window.scrollY, raf = 0
        const check = () => {
            raf = 0
            const y = window.scrollY, dy = y - last
            const el = root.current
            const applies = mode === "always" || (!!el && el.offsetWidth <= 900)
            if (!applies || y < 80) setAway(false)
            else if (dy > 6) setAway(true)
            else if (dy < -6) setAway(false)
            if (Math.abs(dy) > 6 || y < 80) last = y
        }
        const onScroll = () => raf || (raf = requestAnimationFrame(check))
        const show = () => setAway(false) // keyboard focus in the menu brings it back
        window.addEventListener("scroll", onScroll, { passive: true })
        root.current?.addEventListener("focusin", show)
        return () => {
            window.removeEventListener("scroll", onScroll)
            root.current?.removeEventListener("focusin", show)
            if (raf) cancelAnimationFrame(raf)
        }
    }, [p.hideOnScroll])
    useEffect(() => void (away && setOpen(-1)), [away])
    // "auto": what's behind the logo and behind the bar, re-checked as the page scrolls.
    // Walks up from the page element under each point to the first solid background
    // (photos, video and 3D count as their section's background)
    const [tone, setTone] = useState<{ logo: boolean; bar: boolean }>({ logo: true, bar: true })
    useEffect(() => {
        if ((p.theme ?? "auto") !== "auto") return
        const el = root.current
        if (!el || typeof document === "undefined" || !document.elementsFromPoint) return
        const dark = (x: number, y: number) => {
            for (const hit of document.elementsFromPoint(x, y)) {
                // skip the menu itself and anything it sits inside (its wrapper, a fixed container)
                if (el.contains(hit) || hit.contains(el)) continue
                for (let n: Element | null = hit; n; n = n.parentElement) {
                    const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(n).backgroundColor)
                    if (!m) continue
                    const [r, g, b, a = 1] = m[1].split(",").map((v) => parseFloat(v))
                    if (a < 0.5) continue
                    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 150
                }
                break
            }
            return false
        }
        let raf = 0
        const check = () => {
            raf = 0
            const logo = el.querySelector(".sn-logo")?.getBoundingClientRect()
            const bar = el.querySelector(".sn-bar")?.getBoundingClientRect() || el.querySelector(".sn-burger")?.getBoundingClientRect()
            const next = {
                logo: logo ? dark(logo.left + logo.width / 2, logo.top + logo.height / 2) : true,
                bar: bar ? dark(bar.left + bar.width / 2, bar.top + bar.height / 2) : true,
            }
            setTone((t) => (t.logo === next.logo && t.bar === next.bar ? t : next))
        }
        const schedule = () => raf || (raf = requestAnimationFrame(check))
        check()
        window.addEventListener("scroll", schedule, { passive: true })
        window.addEventListener("resize", schedule)
        const iv = setInterval(schedule, 800) // content that changes without a scroll (a page swap, a pinned section)
        return () => {
            window.removeEventListener("scroll", schedule)
            window.removeEventListener("resize", schedule)
            clearInterval(iv)
            if (raf) cancelAnimationFrame(raf)
        }
    }, [p.theme])
    const theme = p.theme ?? "auto"
    const barDark = theme === "auto" ? tone.bar : theme === "dark"
    const logoDark = theme === "auto" ? tone.logo : theme === "dark"
    // the highlighted link: picked by hand, else the one (or whose dropdown) matching this page
    const activeIdx = (() => {
        if (!unset(p.active)) return items.findIndex((it) => it.label === p.active)
        if (!path) return -1
        return items.findIndex((it) => clean(it.link) === path || it.dropdown.some((d) => clean(d.link) === path))
    })()
    const enter = (i: number) => {
        if (closeT.current) clearTimeout(closeT.current)
        setOpen(i)
    }
    const leave = () => {
        if (closeT.current) clearTimeout(closeT.current)
        closeT.current = setTimeout(() => setOpen(-1), 180)
    }
    const pc = or(p.primaryColor, "#8DFF66"), pt = or(p.primaryText, "#060C1A")
    const sc = or(p.secondaryColor, "#2B8CFF"), st = or(p.secondaryText, "#FFFFFF")
    const makeLogo = (dark: boolean) => (
        <a className="sn-logo" href={or(p.logoLink, "/")} aria-label="Sett, naar de homepage">
            {p.logo?.src ? (
                <img src={p.logo.src} srcSet={p.logo.srcSet} alt={p.logo.alt || "Sett"} />
            ) : (
                <svg viewBox={p.showTagline === false ? "0 0 130 51.5" : "0 0 130 66.338"} role="img" aria-label="Sett, energietransitie all sett">
                    <path d={LOGO_D} fill={or(p.logoColor, dark ? "#FFFFFF" : "#0B0E1A")} />
                </svg>
            )}
        </a>
    )
    const logo = makeLogo(logoDark)
    const buttons = (
        <div className="sn-btns">
            {p.primary !== "" && (
                <a className="sn-btn" href={or(p.primaryLink, "/pre-order")} style={{ background: pc, color: pt }} aria-label={p.primary ?? "Bestel jouw Sett"}>
                    <span className="t">{p.primary ?? "Bestel jouw Sett"}</span> <Cart />
                </a>
            )}
            {p.secondary !== "" && (
                <a className="sn-btn" href={or(p.secondaryLink, "tel:+31332104140")} style={{ background: sc, color: st }} aria-label={p.secondary ?? "Bel direct"}>
                    <span className="t">{p.secondary ?? "Bel direct"}</span> <Phone />
                </a>
            )}
        </div>
    )
    // the phone menu lives at the end of the page (a portal), above every other layer:
    // inside the menu it would be caught in the menu wrapper's stacking order
    const [portalReady, setPortalReady] = useState(false)
    useEffect(() => setPortalReady(typeof document !== "undefined"), [])
    useEffect(() => {
        if (!menu || typeof document === "undefined") return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => void (document.body.style.overflow = prev)
    }, [menu])
    const sheetLayer = (
        <div className={"sn sn-layer" + (barDark ? " dark" : "") + (menu ? " menu" : "")} style={{ "--sn-side": (typeof p.side === "number" ? p.side : 24) + "px" } as React.CSSProperties}>
            <div className="sn-sheet" aria-hidden={!menu} role="dialog" aria-modal="true" aria-label="Menu">
                <div className="sn-sheet-head">
                    {makeLogo(barDark)}
                    <button type="button" className="sn-burger sn-close" aria-label="Menu sluiten" onClick={() => setMenu(false)}>
                        <i />
                    </button>
                </div>
                <ul>
                    {items.map((it, i) => (
                        <li key={i}>
                            <a className={"top" + (activeIdx === i ? " on" : "")} href={it.link} onClick={() => setMenu(false)}>
                                {it.label}
                            </a>
                            {it.dropdown.length > 0 && (
                                <div className="sub">
                                    {it.dropdown.map((d, j) => (
                                        <a key={j} className="sn-pill" href={d.link} onClick={() => setMenu(false)}>
                                            {d.label.replace(/\s*\(V2\)\s*$/i, "")}
                                            {/\(V2\)\s*$/i.test(d.label) && <span className="v2">V2</span>}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
                {buttons}
            </div>
        </div>
    )
    const trail = crumbs(routePath || path, items)
    return (
        <nav ref={root} className={"sn" + (barDark ? " dark" : "") + (menu ? " menu" : "") + (away && !menu ? " away" : "")} style={{ ...({ "--sn-side": (typeof p.side === "number" ? p.side : 24) + "px" } as React.CSSProperties), ...p.style }} aria-label="Hoofdmenu">
            <SettFonts />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            {trail && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trail).replace(/</g, "\\u003c") }} />}
            <div className="sn-row">
                <div className="sn-in">
                {logo}
                <div className="sn-bar">
                    {items.map((it, i) => {
                        const has = it.dropdown.length > 0
                        const isOpen = open === i
                        return (
                            <div key={i} className={"sn-item" + (isOpen ? " open" : "")} onMouseEnter={() => has && enter(i)} onMouseLeave={() => has && leave()} onFocus={() => has && enter(i)} onBlur={(e) => has && !e.currentTarget.contains(e.relatedTarget as Node) && leave()}>
                                <a
                                    className={"sn-link" + (activeIdx === i ? " on" : "") + (clean(it.link) === "/" ? " home" : "")}
                                    href={it.link}
                                    aria-haspopup={has ? "true" : undefined}
                                    aria-expanded={has ? isOpen : undefined}
                                    aria-current={activeIdx === i ? "page" : undefined}
                                    onClick={(e) => {
                                        // on touch, the first tap opens the dropdown, the second follows the link
                                        if (has && open !== i && window.matchMedia && window.matchMedia("(hover: none)").matches) {
                                            e.preventDefault()
                                            setOpen(i)
                                        }
                                    }}
                                >
                                    {clean(it.link) === "/" && <House />}
                                    <span className="t">{it.label}</span>
                                    {has && <span className="car" aria-hidden="true" />}
                                </a>
                                {has && (
                                    <div className="sn-drop" role="menu">
                                        {it.dropdown.map((d, j) => (
                                            <a key={j} className="sn-pill" href={d.link} role="menuitem" onClick={() => setOpen(-1)}>
                                                {d.label.replace(/\s*\(V2\)\s*$/i, "")}
                                                {/\(V2\)\s*$/i.test(d.label) && <span className="v2">V2</span>}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                {buttons}
                <button type="button" className="sn-burger" aria-label={menu ? "Menu sluiten" : "Menu openen"} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                    <i />
                </button>
                </div>
            </div>
            {portalReady && createPortal(sheetLayer, document.body)}
            {/* the cookie notice rides along with the menu, so it is on every page (not on the canvas) */}
            {portalReady && p.cookies !== false && !onCanvas() && <CookieBanner />}
        </nav>
    )
}

SettNav.displayName = "Sett · Menu"

addPropertyControls(SettNav, {
    logo: { type: ControlType.ResponsiveImage, title: "Logo", description: "Leeg: het Sett-logo van sett.nl." },
    logoColor: { type: ControlType.Color, title: "Logokleur", description: "Leeg: wit op een donkere achtergrond, navy op een lichte.", hidden: (p: Props) => !!p.logo?.src },
    showTagline: { type: ControlType.Boolean, title: "Ondertitel", defaultValue: true, enabledTitle: "Aan", disabledTitle: "Uit", hidden: (p: Props) => !!p.logo?.src },
    logoLink: { type: ControlType.Link, title: "Logo link" },
    items: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 10,
        defaultValue: ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Tekst" },
                link: { type: ControlType.Link, title: "Link" },
                dropdown: { type: ControlType.String, title: "Dropdown", displayTextArea: true, description: "Eén per regel: Tekst | /link. Zet (V2) achter de tekst voor het V2-label." },
            },
        },
    },
    primary: { type: ControlType.String, title: "Knop 1", defaultValue: "Bestel jouw Sett" },
    primaryLink: { type: ControlType.Link, title: "Knop 1 link" },
    primaryColor: { type: ControlType.Color, title: "Knop 1 kleur", defaultValue: "#8DFF66" },
    primaryText: { type: ControlType.Color, title: "Knop 1 tekst", defaultValue: "#060C1A" },
    secondary: { type: ControlType.String, title: "Knop 2", defaultValue: "Bel direct" },
    secondaryLink: { type: ControlType.Link, title: "Knop 2 link" },
    secondaryColor: { type: ControlType.Color, title: "Knop 2 kleur", defaultValue: "#2B8CFF" },
    secondaryText: { type: ControlType.Color, title: "Knop 2 tekst", defaultValue: "#FFFFFF" },
    theme: { type: ControlType.Enum, title: "Thema", options: ["auto", "light", "dark"], optionTitles: ["Automatisch", "Licht", "Donker"], defaultValue: "auto", description: "Automatisch: logo en balk passen zich aan de achtergrond eronder aan terwijl je scrolt." },
    side: { type: ControlType.Number, title: "Zijmarge", min: 0, max: 120, step: 2, unit: "px", defaultValue: 24, description: "Afstand van logo en knoppen tot de rand." },
    active: { type: ControlType.String, title: "Actieve link", description: "Leeg: automatisch op basis van de pagina. Of de tekst van een link." },
    hideOnScroll: { type: ControlType.Enum, title: "Wegscrollen", options: ["mobile", "always", "never"], optionTitles: ["Op mobiel", "Altijd", "Nooit"], defaultValue: "mobile", description: "Bij naar beneden scrollen gaat het menu uit beeld, bij terug scrollen komt het terug." },
    cookies: { type: ControlType.Boolean, title: "Cookiemelding", defaultValue: true, enabledTitle: "Aan", disabledTitle: "Uit", description: "Toont de cookiemelding op elke pagina met dit menu. Een link naar #cookies opent de instellingen." },
})

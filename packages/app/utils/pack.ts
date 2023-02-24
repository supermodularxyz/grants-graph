import * as d3 from 'd3'
import randomColor from 'randomcolor'

export type DonorPositions = Record<string, number[]>

export type OpenNode = (node: DonorNode, color: string) => void

export enum NodeType {
  Round,
  Project,
  Donor,
}

export type DonorNode = {
  name: string
  shortKey: string
  type: NodeType
  // token: string
  color: string
  highlight?: boolean
  size?: number
}

export type NodeItem = {
  name: string
  title?: string
  shortKey: string
  type: NodeType
  children: DonorNode[]
}

// export const colorMaker = (count: number) => d3.quantize(d3.interpolateHcl('hsl(152,80%,80%)', 'hsl(228,30%,40%)'), count)

// export const colorMaker = () => randomColor({ luminosity: 'dark', format: 'rgba' })
export const colors = [
  'rgba(214, 12, 150, 0.2616902265563279)',
  'rgba(99, 166, 221, 0.5455226997303873)',
  'rgba(195, 91, 239, 0.559898996037945)',
  'rgba(209, 107, 249, 0.7959907019141246)',
]

export const handleNodeClick = (e: any, d: any, highlightColor: string) => {
  if (d.data.type === NodeType.Donor) {
    const selectedNodes = d3.selectAll(`.node-${d.data.name}`)
    const active = selectedNodes.attr('data-active') === 'true'

    selectedNodes.attr('fill', active ? d.data.color : highlightColor) // TODO : choose a different color for active selections
    selectedNodes.attr('data-active', selectedNodes.attr('data-active') === null ? 'true' : null)
  }
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/pack
function Pack(
  data: any,
  onNodeClick: OpenNode,
  {
    // data is either tabular (array of objects) or hierarchy (nested objects)
    path, // as an alternative to id and parentId, returns an array identifier, imputing internal nodes
    id = Array.isArray(data) ? (d: any) => d.id : null, // if tabular data, given a d in data, returns a unique identifier (string)
    parentId = Array.isArray(data) ? (d: any) => d.parentId : null, // if tabular data, given a node d, returns its parent’s identifier
    children, // if hierarchical data, given a d in data, returns its children
    value, // given a node d, returns a quantitative value (for area encoding; null for count)
    sort = (a: any, b: any) => d3.descending(a.value, b.value), // how to sort nodes prior to layout
    label, // given a leaf node d, returns the display name
    title, // given a node d, returns its hover text
    link, // given a node d, its link (if any)
    linkTarget = '_blank', // the target attribute for links, if any
    width = 900, // outer width, in pixels
    height = 900, // outer height, in pixels
    margin = 1, // shorthand for margins
    marginTop = margin, // top margin, in pixels
    marginRight = margin, // right margin, in pixels
    marginBottom = margin, // bottom margin, in pixels
    marginLeft = margin, // left margin, in pixels
    padding = 3, // separation between circles
    fill = '#ddd', // fill for leaf circles
    fillOpacity, // fill opacity for leaf circles
    stroke = '#bbb', // stroke for internal circles
    strokeWidth, // stroke width for internal circles
    strokeOpacity, // stroke opacity for internal circles
  }: {
    path?: any
    id?: any
    parentId?: any
    children?: any
    value?: any
    sort?: any
    label?: any
    title?: any
    link?: any
    linkTarget?: any
    width?: any
    height?: any
    margin?: any
    marginTop?: any
    marginBottom?: any
    marginRight?: any
    marginLeft?: any
    padding?: any
    fill?: any
    fillOpacity?: any
    stroke?: any
    strokeWidth?: any
    strokeOpacity?: any
  } = {}
) {
  // If id and parentId options are specified, or the path option, use d3.stratify
  // to convert tabular data to a hierarchy; otherwise we assume that the data is
  // specified as an object {children} with nested objects (a.k.a. the “flare.json”
  // format), and use d3.hierarchy.
  const root: any = d3.hierarchy(data, children)

  // Compute the values of internal nodes by aggregating from the leaves.
  value == null ? root.count() : root.sum((d: any) => Math.max(0, value(d)))

  // Compute labels and titles.
  const descendants = root.descendants()
  // const leaves = descendants.filter((d: any) => !d.children)
  const leaves = descendants
  leaves.forEach((d: any, i: any) => (d.index = i))
  const L = label == null ? null : leaves.map((d: any) => label(d.data, d))
  const T = title == null ? null : descendants.map((d: any) => title(d.data, d))

  // Sort the leaves (typically by descending value for a pleasing layout).
  if (sort != null) root.sort(sort)

  // Compute the layout.
  d3
    .pack()
    .size([width - marginLeft - marginRight, height - marginTop - marginBottom])
    .padding(padding)(root)

  const svg = d3
    .create('svg')
    .attr('id', 'd3-svg')
    .attr('viewBox', [-marginLeft, -marginTop, width, height])
    .attr('width', width)
    .attr('height', height)
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('text-anchor', 'middle')

  // svg.call(
  //   d3
  //     .zoom()
  //     .extent([
  //       [0, 0],
  //       [width, height],
  //     ])
  //     .scaleExtent([1, 20])
  //     .on('zoom', zoomed)
  // )

  // function zoomed({ transform }: any) {
  //   svg.attr('transform', transform)
  // }

  const node = svg
    .selectAll('a')
    .data(descendants)
    .join('a')
    // .attr('xlink:href', link == null ? null : (d: any, i) => link(d.data, d))
    // .attr('target', link == null ? null : linkTarget)
    .attr('transform', (d: any) => `translate(${d.x},${d.y})`)

  node
    .append('circle')
    .attr('fill', (d: any, i: any) => {
      return !d.children ? leaves[i].data.color : '#fff'
    })
    .attr('class', (d: any) => `node-${d.data.name}`)
    .attr('fill-opacity', (d: any) => (d.children ? null : fillOpacity))
    .attr('stroke', (d: any, i: any) => {
      // return d.children ? leaves[i].data.color : null
      return d.children ? stroke : null
    })
    .attr('stroke-width', (d: any) => (d.children ? strokeWidth : null))
    .attr('stroke-opacity', (d: any) => (d.children ? strokeOpacity : null))
    .attr('r', (d: any) => d.r)
    .on('mouseover', (e: any, d: any) => {
      if (d.data.type === NodeType.Donor) {
        const selectedNodes = d3.selectAll(`.node-${d.data.name}`)
        if (selectedNodes.attr('data-active') === null) {
          selectedNodes.attr('fill', '#4f80ef')
        }

        const parentNode = d3.selectAll(`.project-${d.parent.data.name}`)
        parentNode.style('display', 'none')
      }

      if (d.data.type === NodeType.Project) {
        const selectedNodes = d3.selectAll(`.project-${d.data.name}`)
        selectedNodes.style('display', 'none')
      }
    })
    .on('mouseout', (e: any, d: any) => {
      if (d.data.type === NodeType.Donor) {
        const selectedNodes = d3.selectAll(`.node-${d.data.name}`)
        if (selectedNodes.attr('data-active') === null) {
          selectedNodes.attr('fill', d.data.color)
        }

        const parentNode = d3.selectAll(`.project-${d.parent.data.name}`)
        parentNode.style('display', 'inline')
      }

      if (d.data.type === NodeType.Project) {
        const selectedNodes = d3.selectAll(`.project-${d.data.name}`)
        selectedNodes.style('display', 'inline')
      }
    })
    .on('click', (e: any, d: any) => {
      // const highlightColor = randomColor({ luminosity: 'dark' })
      const highlightColor = randomColor()
      handleNodeClick(e, d, highlightColor)
      onNodeClick(d.data, highlightColor)
    })

  node
    .append('text')
    .style('fill-opacity', null)
    .style('font-size', 12)
    .style('font-weight', 'bold')
    .style('display', 'inline')
    .style('max-width', '40px')
    .attr('class', (d: any) => `project-${d.data.name}`)
    .text((d: any) => {
      return d.data.type === NodeType.Project && d.r > 10 ? d.data.title.split(':')[0] : null
    })

  if (T) node.append('title').text((d, i) => T[i])

  if (L) {
    // A unique identifier for clip paths (to avoid conflicts).
    const uid = `O-${Math.random()
      .toString(16)
      .slice(2)}`

    const leaf = node.filter((d: any) => d.children && d.r > 5 && L[d.index] != null)
    // const leaf = node.filter((d: any) => !d.children && d.r > 10 && L[d.index] != null)

    leaf
      .append('clipPath')
      .attr('id', (d: any) => `${uid}-clip-${d.index}`)
      .append('circle')
      .attr('r', (d: any) => d.r)

    leaf
      .append('text')
      // .attr('clip-path', (d: any) => `url(${new URL(`#${uid}-clip-${d.index}`)})`)
      .selectAll('tspan')
      .data((d: any) => `${L[d.index]}`.split(/\n/g))
      .join('tspan')
      .attr('x', 0)
      .attr('y', (d, i, D) => `${i - D.length / 2 + 0.85}em`)
      .attr('fill-opacity', (d, i, D) => (i === D.length - 1 ? 0.7 : null))
      .text((d) => d)
  }

  return svg.node()
}

export default Pack

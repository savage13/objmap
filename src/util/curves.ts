
// Factorial
function fact(n: number): number {
  let x = 1;
  for (let i = 2; i <= n; i++) {
    x *= i;
  }
  return x;
}

// Binomial Coefficients
function bincoeff(n: number, k: number): number {
  if (k == 0) {
    return 1;
  }
  return fact(n) / (fact(k) * (fact(n - k)));
}

function range(n: number): number[] {
  return [...Array(n)].map((item: any, index: number) => index);
}

// calculate bezier coefficients: binomial coefficients
function bezier_coeff(n: number): number[] {
  return range(n + 1).map((i: number) => bincoeff(n, i));
}

// dot-product
function dot(a: number[], b: number[]): number {
  let x = 0;
  for (let i = 0; i < a.length; i++) {
    x += a[i] * b[i];
  }
  return x;
}

// Point addition
function pt_add(a: number[], b: number[]): number[] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

// Bezier Curve
//
// B(t) =  \Sum_{i=0}^{n} coeff(i,n) (1 - t)^{n-i} t^i P_i
//
// n = Number of points - 1 ; (n is inclusive)
// All segments are divided into 36 segments, t = 0 to 1 ; dt = 1/36
// Curve construction is performed on all components [x,y,z]
//
function bezier(pts: any) {
  let steps = 36;
  let out = [];
  let n = pts.length;
  if (n == 2) {
    return pts;
  }
  const coeff = bezier_coeff(n - 1);

  let t0 = 0;
  let dt = 1.0 / (steps - 1);
  let xi = pts.map((p: any) => p[0]);
  let yi = pts.map((p: any) => p[1]);
  let zi = pts.map((p: any) => p[2]);
  for (let k = 0; k < steps; k++) {
    const t = t0 + k * dt;
    const ti = range(n).map((i: number) => coeff[i] * Math.pow(1.0 - t, n - 1 - i) * Math.pow(t, i));
    for (let i = 0; i < n; i++) {
      let pt = [dot(ti, xi), dot(ti, yi), dot(ti, zi)];
      out.push(pt);
    }
  }
  return out;
}

// Linear Rail path without any Control Points
function rail_path_linear(rail: any): any {
  let pts = rail.RailPoints.map((pt: any) => pt.Translate);
  if (rail['IsClosed']) {
    pts.push(pts[0])
  }
  return pts;
}

// Bezier Path with Control Points
// Each true is assumed to have two control points associated with it
// The 2nd [1] control point builds the curve towards the next distinct point
// The 1st [0] control point builds the curve towards the previous distinct point
//
//       b1 ____ c0
//         /    \
//  a     b      c     d
//   \___/        \___/
// a1    b0      c1    d0
//
//  Points: a, b, c, d
//  Control points: a1, b0, b1, c0, c1, d0
//
//  Loop over sections of the bezier curve
//   - Build: [b, b+b1, c+c0, c] that is passed to bezier()
//   - Append bezier() output to the curve
//  If the curve is closed, the the first point as a last point
//  If the curve is open, do not use the last point as a curve starting point
//
function rail_path_bezier(rail: any): any {
  let out = [];
  let n = rail.RailPoints.length;
  if (!rail['IsClosed']) {
    n -= 1;
  }

  for (let i = 0; i < n; i++) {
    let j = (i + 1);
    if (rail['IsClosed']) {
      j = j % n;
    }
    let p0 = rail.RailPoints[i].Translate;
    let p1 = rail.RailPoints[j].Translate;
    let bez = [p0];
    if (rail.RailPoints[i].ControlPoints) {
      bez.push(pt_add(p0, rail.RailPoints[i].ControlPoints[1]));
    }
    if (rail.RailPoints[j].ControlPoints) {
      bez.push(pt_add(p1, rail.RailPoints[j].ControlPoints[0]));
    }
    bez.push(p1);
    out.push(...bezier(bez))
  }
  return out;
}

export function rail_path(rail: any): any {
  if (rail.RailType == "Linear") {
    return rail_path_linear(rail);
  }
  return rail_path_bezier(rail);
}

/*
 * SAT Climb question bank: Math.
 *
 * All questions are ORIGINAL, written in the style and format of the digital SAT. Do not paste
 * in College Board / Bluebook / Khan Academy / prep-book questions: they are copyrighted.
 * Status: first draft, not yet human-reviewed. Run `node tools/check-questions.js` after edits.
 *
 * Format: one block per question, written inside String.raw so LaTeX backslashes survive.
 *
 *   ### <skill> <difficulty 1-3> <answer>
 *   question text (blank line = new paragraph; math goes inside \( ... \))
 *   TABLE: optional table title, followed by "|"-separated rows, first row = headers
 *   A) choice          (omit choices for a student-produced response question)
 *   B) choice
 *   C) choice
 *   D) choice
 *   = explanation
 *
 * <answer> is a letter A-D, or for a student-produced response "=" then every accepted value
 * separated by "|" (e.g. =3/4|0.75). Equivalent numbers are accepted automatically.
 *
 * IDs come from position within each skill, so ALWAYS APPEND; never reorder or delete.
 */
(function () {
  const SKILLS = [
    { id: 'm-lin1', name: 'Linear equations in one variable', domain: 'Algebra', section: 'math' },
    { id: 'm-linf', name: 'Linear functions', domain: 'Algebra', section: 'math' },
    { id: 'm-lin2', name: 'Linear equations in two variables', domain: 'Algebra', section: 'math' },
    { id: 'm-sys', name: 'Systems of linear equations', domain: 'Algebra', section: 'math' },
    { id: 'm-ineq', name: 'Linear inequalities', domain: 'Algebra', section: 'math' },
    { id: 'm-equiv', name: 'Equivalent expressions', domain: 'Advanced Math', section: 'math' },
    { id: 'm-nleq', name: 'Nonlinear equations and systems', domain: 'Advanced Math', section: 'math' },
    { id: 'm-nlf', name: 'Nonlinear functions', domain: 'Advanced Math', section: 'math' },
    { id: 'm-ratio', name: 'Ratios, rates, and units', domain: 'Problem-Solving and Data Analysis', section: 'math' },
    { id: 'm-pct', name: 'Percentages', domain: 'Problem-Solving and Data Analysis', section: 'math' },
    { id: 'm-data1', name: 'One-variable data', domain: 'Problem-Solving and Data Analysis', section: 'math' },
    { id: 'm-data2', name: 'Two-variable data and models', domain: 'Problem-Solving and Data Analysis', section: 'math' },
    { id: 'm-prob', name: 'Probability', domain: 'Problem-Solving and Data Analysis', section: 'math' },
    { id: 'm-infer', name: 'Inference and statistical claims', domain: 'Problem-Solving and Data Analysis', section: 'math' },
    { id: 'm-area', name: 'Area and volume', domain: 'Geometry and Trigonometry', section: 'math' },
    { id: 'm-tri', name: 'Lines, angles, and triangles', domain: 'Geometry and Trigonometry', section: 'math' },
    { id: 'm-trig', name: 'Right triangles and trigonometry', domain: 'Geometry and Trigonometry', section: 'math' },
    { id: 'm-circ', name: 'Circles', domain: 'Geometry and Trigonometry', section: 'math' },
  ];

  const BANK = String.raw`
### m-lin1 1 B
If \(3x + 7 = 22\), what is the value of \(x\)?
A) \(3\)
B) \(5\)
C) \(7\)
D) \(15\)
= Subtract 7 from both sides: \(3x = 15\). Divide by 3: \(x = 5\).

### m-lin1 1 =20
If \(\frac{x}{4} - 2 = 3\), what is the value of \(x\)?
= Add 2 to both sides: \(\frac{x}{4} = 5\). Multiply both sides by 4: \(x = 20\).

### m-lin1 2 C
A plumber charges a flat fee of $45 plus $30 per hour of work. A customer's total bill was $210. For how many hours did the plumber work?
A) \(4.5\)
B) \(5\)
C) \(5.5\)
D) \(7\)
= Set up \(45 + 30h = 210\). Then \(30h = 165\), so \(h = 5.5\) hours.

### m-lin1 2 A
What value of \(x\) satisfies the equation \(2(x - 3) + 5 = 4x - 9\)?
A) \(4\)
B) \(2\)
C) \(-4\)
D) \(8\)
= Distribute: \(2x - 6 + 5 = 4x - 9\), so \(2x - 1 = 4x - 9\). Then \(8 = 2x\), and \(x = 4\).

### m-lin1 3 D
In the equation \(ax + 6 = 3x + b\), \(a\) and \(b\) are constants. If the equation has infinitely many solutions, what is the value of \(a + b\)?
A) \(3\)
B) \(6\)
C) \(0\)
D) \(9\)
= An equation has infinitely many solutions when both sides are identical. The \(x\)-coefficients must match (\(a = 3\)) and the constants must match (\(b = 6\)), so \(a + b = 9\).

### m-lin1 3 =-4
For what value of \(k\) does the equation \(5(x + k) = 5x + 3k - 8\) have infinitely many solutions?
= Distribute: \(5x + 5k = 5x + 3k - 8\). The \(x\)-terms already match, so the constants must match too: \(5k = 3k - 8\), so \(2k = -8\) and \(k = -4\).

### m-linf 1 C
The function \(f\) is defined by \(f(x) = 4x - 9\). What is the value of \(f(5)\)?
A) \(-29\)
B) \(1\)
C) \(11\)
D) \(29\)
= Substitute 5 for \(x\): \(f(5) = 4(5) - 9 = 20 - 9 = 11\).

### m-linf 1 A
A gym membership costs $25 to join plus $15 per month. Which function \(C\) gives the total cost, in dollars, of a membership for \(m\) months?
A) \(C(m) = 15m + 25\)
B) \(C(m) = 25m + 15\)
C) \(C(m) = 40m\)
D) \(C(m) = 15m - 25\)
= The $15 is charged every month, so it multiplies \(m\). The $25 is paid once, so it is the constant: \(C(m) = 15m + 25\).

### m-linf 2 B
The graph of the linear function \(f\) in the xy-plane passes through the points \((2, 7)\) and \((6, 19)\). What is the slope of the graph?
A) \(2\)
B) \(3\)
C) \(4\)
D) \(12\)
= Slope is the change in \(y\) over the change in \(x\): \(\frac{19 - 7}{6 - 2} = \frac{12}{4} = 3\).

### m-linf 2 =46
For the linear function \(g\), \(g(0) = -4\) and \(g(3) = 11\). What is the value of \(g(10)\)?
= The slope is \(\frac{11 - (-4)}{3 - 0} = 5\) and the y-intercept is \(-4\), so \(g(x) = 5x - 4\). Then \(g(10) = 50 - 4 = 46\).

### m-linf 2 D
A tank contains 500 liters of water. Water drains from the tank at a constant rate, and after 8 minutes the tank contains 380 liters. Which function \(V\) gives the volume of water, in liters, in the tank \(t\) minutes after it began draining?
A) \(V(t) = 380 - 15t\)
B) \(V(t) = 500 - 8t\)
C) \(V(t) = 500 - 120t\)
D) \(V(t) = 500 - 15t\)
= The tank lost \(500 - 380 = 120\) liters in 8 minutes, a rate of \(120 \div 8 = 15\) liters per minute. Starting at 500: \(V(t) = 500 - 15t\).

### m-linf 3 =31
The function \(h\) is linear, and \(h(x + 2) = h(x) + 7\) for all values of \(x\). If \(h(1) = 3\), what is the value of \(h(9)\)?
= Increasing \(x\) by 2 increases \(h\) by 7, so the slope is \(\frac{7}{2}\). From \(x = 1\) to \(x = 9\), \(x\) increases by 8, so \(h\) increases by \(8 \cdot \frac{7}{2} = 28\). Then \(h(9) = 3 + 28 = 31\).

### m-lin2 1 B
What is the y-intercept of the graph of \(y = -2x + 8\) in the xy-plane?
A) \((-2, 0)\)
B) \((0, 8)\)
C) \((4, 0)\)
D) \((0, -2)\)
= In \(y = mx + b\), the y-intercept is \((0, b)\). Here \(b = 8\), so the y-intercept is \((0, 8)\). Choice C is the x-intercept.

### m-lin2 1 D
Which point lies on the graph of \(3x + 2y = 12\) in the xy-plane?
A) \((2, 2)\)
B) \((1, 4)\)
C) \((3, 2)\)
D) \((2, 3)\)
= Test each point: \(3(2) + 2(3) = 6 + 6 = 12\). The other points give 10, 11, and 13.

### m-lin2 2 A
Tickets to a school play cost $6 for students and $10 for adults. The play earned $1,200 from ticket sales. If \(s\) is the number of student tickets sold and \(a\) is the number of adult tickets sold, which equation represents this situation?
A) \(6s + 10a = 1{,}200\)
B) \(10s + 6a = 1{,}200\)
C) \(16(s + a) = 1{,}200\)
D) \(s + a = 1{,}200\)
= Student tickets bring in \(6s\) dollars and adult tickets bring in \(10a\) dollars. Together they total $1,200.

### m-lin2 2 =7
Line \(\ell\) in the xy-plane passes through the point \((-1, 4)\) and has a slope of 3. What is the y-coordinate of the y-intercept of line \(\ell\)?
= Point-slope form: \(y - 4 = 3(x + 1)\), so \(y = 3x + 7\). The y-intercept is \((0, 7)\).

### m-lin2 3 C
Line \(k\) is perpendicular to the line \(2x - 5y = 10\) and passes through the point \((4, 1)\). Which equation defines line \(k\)?
A) \(y = \frac{2}{5}x - \frac{3}{5}\)
B) \(y = -\frac{2}{5}x + \frac{13}{5}\)
C) \(y = -\frac{5}{2}x + 11\)
D) \(y = \frac{5}{2}x - 9\)
= Rewrite \(2x - 5y = 10\) as \(y = \frac{2}{5}x - 2\). A perpendicular slope is the negative reciprocal, \(-\frac{5}{2}\). Then \(y - 1 = -\frac{5}{2}(x - 4)\) gives \(y = -\frac{5}{2}x + 11\).

### m-lin2 3 =-6
In the xy-plane, the graph of \(ax + 4y = 20\) is parallel to the graph of \(y = \frac{3}{2}x - 7\), where \(a\) is a constant. What is the value of \(a\)?
= Solve for \(y\): \(y = -\frac{a}{4}x + 5\). Parallel lines have equal slopes, so \(-\frac{a}{4} = \frac{3}{2}\), which gives \(a = -6\).

### m-sys 1 C
\(x + y = 10\)

\(x - y = 4\)

If \((x, y)\) is the solution to the system of equations above, what is the value of \(x\)?
A) \(3\)
B) \(6\)
C) \(7\)
D) \(14\)
= Add the equations: \(2x = 14\), so \(x = 7\).

### m-sys 1 =15
\(y = 3x\)

\(2x + y = 25\)

If \((x, y)\) is the solution to the system of equations above, what is the value of \(y\)?
= Substitute \(y = 3x\): \(2x + 3x = 25\), so \(x = 5\) and \(y = 15\).

### m-sys 2 B
A store sells notebooks for $3 each and binders for $5 each. Maria bought 12 items and spent $46. How many binders did she buy?
A) \(4\)
B) \(5\)
C) \(7\)
D) \(9\)
= Let \(n + b = 12\) and \(3n + 5b = 46\). Substitute \(n = 12 - b\): \(36 - 3b + 5b = 46\), so \(2b = 10\) and \(b = 5\).

### m-sys 2 D
\(3x + 2y = 7\)

\(5x - 2y = 9\)

If \((x, y)\) is the solution to the system of equations above, what is the value of \(xy\)?
A) \(0.5\)
B) \(2\)
C) \(4\)
D) \(1\)
= Add the equations: \(8x = 16\), so \(x = 2\). Then \(6 + 2y = 7\), so \(y = 0.5\), and \(xy = 1\).

### m-sys 3 A
\(2x + ky = 8\)

\(6x + 15y = 24\)

In the system of equations above, \(k\) is a constant. For what value of \(k\) does the system have infinitely many solutions?
A) \(5\)
B) \(3\)
C) \(15\)
D) \(45\)
= Infinitely many solutions means the equations describe the same line. Multiplying the first equation by 3 gives \(6x + 3ky = 24\), which matches the second equation when \(3k = 15\), so \(k = 5\).

### m-sys 3 =-8
\(4x - 3y = 11\)

\(ax + 6y = 7\)

In the system of equations above, \(a\) is a constant. If the system has no solution, what is the value of \(a\)?
= No solution means the lines are parallel but not the same line. The coefficients must be proportional: \(\frac{a}{4} = \frac{6}{-3} = -2\), so \(a = -8\). Check: \(-2 \cdot 11 = -22 \ne 7\), so the lines are distinct.

### m-ineq 1 A
Which value of \(x\) satisfies the inequality \(2x + 5 > 17\)?
A) \(7\)
B) \(6\)
C) \(5\)
D) \(0\)
= \(2x > 12\), so \(x > 6\). Only 7 is greater than 6. Note that 6 itself does not work because the inequality is strict.

### m-ineq 1 C
A delivery van can carry at most 1,500 pounds. The driver weighs 180 pounds, and each box weighs 40 pounds. Which inequality represents the number of boxes, \(b\), the van can carry along with the driver?
A) \(180 + 40b \geq 1{,}500\)
B) \(40 + 180b \leq 1{,}500\)
C) \(180 + 40b \leq 1{,}500\)
D) \(40b \leq 180\)
= Total weight is the driver plus the boxes, \(180 + 40b\). "At most" means less than or equal to: \(180 + 40b \leq 1{,}500\).

### m-ineq 2 =7
What is the greatest integer value of \(x\) that satisfies \(7 - 3x \geq -14\)?
= Subtract 7: \(-3x \geq -21\). Divide by \(-3\) and flip the sign: \(x \leq 7\). The greatest integer is 7.

### m-ineq 2 B
Which point \((x, y)\) is a solution to the system of inequalities \(y > 2x - 1\) and \(y < -x + 5\)?
A) \((3, 6)\)
B) \((1, 3)\)
C) \((0, -2)\)
D) \((4, 0)\)
= For \((1, 3)\): \(3 > 2(1) - 1 = 1\) is true and \(3 < -1 + 5 = 4\) is true. Each other point fails at least one inequality.

### m-ineq 3 D
A student has $60 to spend on pens that cost $1.50 each and notebooks that cost $4 each. She wants to buy at least 10 notebooks. What is the maximum number of pens she can buy?
A) \(10\)
B) \(12\)
C) \(40\)
D) \(13\)
= To maximize pens, buy the minimum 10 notebooks for $40, leaving $20. Then \(1.50p \leq 20\) gives \(p \leq 13.\overline{3}\), so the maximum is 13 pens.

### m-ineq 3 =2
How many integer values of \(x\) satisfy \(-3 < 2x - 7 \leq 1\)?
= Add 7 to every part: \(4 < 2x \leq 8\). Divide by 2: \(2 < x \leq 4\). The integers are 3 and 4, so there are 2 values.

### m-equiv 1 B
Which expression is equivalent to \(3(2x - 4) + 5x\)?
A) \(11x - 4\)
B) \(11x - 12\)
C) \(6x - 7\)
D) \(x - 12\)
= Distribute: \(6x - 12 + 5x = 11x - 12\).

### m-equiv 1 A
Which expression is equivalent to \(x^2 \cdot x^5\)?
A) \(x^7\)
B) \(x^{10}\)
C) \(2x^7\)
D) \(x^3\)
= When multiplying powers with the same base, add the exponents: \(x^{2+5} = x^7\).

### m-equiv 1 C
Which expression is equivalent to \((x + 3)(x - 5)\)?
A) \(x^2 - 15\)
B) \(x^2 + 2x - 15\)
C) \(x^2 - 2x - 15\)
D) \(x^2 - 8x - 15\)
= Multiply each pair of terms: \(x^2 - 5x + 3x - 15 = x^2 - 2x - 15\).

### m-equiv 2 D
Which expression is equivalent to \(x^2 - 49\)?
A) \((x - 7)^2\)
B) \((x + 7)^2\)
C) \((x - 49)(x + 1)\)
D) \((x - 7)(x + 7)\)
= This is a difference of squares, \(a^2 - b^2 = (a - b)(a + b)\), with \(a = x\) and \(b = 7\).

### m-equiv 2 =12
If \((2x + 3)^2 = ax^2 + bx + c\) for all values of \(x\), where \(a\), \(b\), and \(c\) are constants, what is the value of \(b\)?
= Expand: \((2x + 3)^2 = 4x^2 + 12x + 9\), so \(b = 12\).

### m-equiv 2 B
Which expression is equivalent to \(\frac{12x^5y^3}{4x^2y}\), where \(x\) and \(y\) are nonzero?
A) \(3x^3y^3\)
B) \(3x^3y^2\)
C) \(8x^3y^2\)
D) \(3x^7y^4\)
= Divide the coefficients (\(12 \div 4 = 3\)) and subtract exponents: \(x^{5-2} = x^3\) and \(y^{3-1} = y^2\).

### m-equiv 2 A
Which expression is equivalent to \(x^{\frac{3}{4}}\), where \(x > 0\)?
A) \(\sqrt[4]{x^3}\)
B) \(\sqrt[3]{x^4}\)
C) \(\frac{x^3}{4}\)
D) \(\frac{3}{4}x\)
= A fractional exponent \(\frac{m}{n}\) means the \(n\)th root of \(x^m\): \(x^{\frac{3}{4}} = \sqrt[4]{x^3}\).

### m-equiv 3 C
Which expression is equivalent to \(\frac{2}{x - 1} + \frac{3}{x + 2}\), for \(x \ne 1\) and \(x \ne -2\)?
A) \(\frac{5}{2x + 1}\)
B) \(\frac{5x + 1}{x^2 - x - 2}\)
C) \(\frac{5x + 1}{x^2 + x - 2}\)
D) \(\frac{5x + 7}{x^2 + x - 2}\)
= Use the common denominator \((x - 1)(x + 2) = x^2 + x - 2\). The numerator is \(2(x + 2) + 3(x - 1) = 5x + 1\).

### m-equiv 3 =-2
The expression \(6x^2 - 7x - 20\) can be written as \((ax + 4)(2x + b)\), where \(a\) and \(b\) are constants. What is the value of \(a + b\)?
= Matching \(x^2\) terms: \(2a = 6\), so \(a = 3\). Matching constants: \(4b = -20\), so \(b = -5\). Check the middle term: \(ab + 8 = -15 + 8 = -7\). So \(a + b = -2\).

### m-equiv 3 D
The equation \(x^2 - 8x + 3 = 0\) can be rewritten in the form \((x - h)^2 = k\), where \(h\) and \(k\) are constants. What is the value of \(k\)?
A) \(3\)
B) \(16\)
C) \(19\)
D) \(13\)
= Complete the square: \(x^2 - 8x = -3\). Add \(\left(\frac{8}{2}\right)^2 = 16\) to both sides: \((x - 4)^2 = 13\).

### m-nleq 1 A
What are the solutions to the equation \(x^2 = 36\)?
A) \(-6\) and \(6\)
B) \(6\) only
C) \(18\) only
D) \(-18\) and \(18\)
= Both \(6^2\) and \((-6)^2\) equal 36, so there are two solutions.

### m-nleq 1 =5
If \(x^2 - 5x = 0\) and \(x > 0\), what is the value of \(x\)?
= Factor: \(x(x - 5) = 0\), so \(x = 0\) or \(x = 5\). Since \(x > 0\), \(x = 5\).

### m-nleq 1 C
What is the positive solution to \((x - 3)(x + 8) = 0\)?
A) \(8\)
B) \(-3\)
C) \(3\)
D) \(5\)
= A product is zero when a factor is zero: \(x = 3\) or \(x = -8\). The positive solution is 3.

### m-nleq 2 B
What are the solutions to \(x^2 + 2x - 15 = 0\)?
A) \(-3\) and \(5\)
B) \(-5\) and \(3\)
C) \(-15\) and \(1\)
D) \(2\) and \(15\)
= Factor: \((x + 5)(x - 3) = 0\), so \(x = -5\) or \(x = 3\).

### m-nleq 2 =9
If \(\sqrt{2x + 7} = 5\), what is the value of \(x\)?
= Square both sides: \(2x + 7 = 25\), so \(x = 9\). Check: \(\sqrt{25} = 5\).

### m-nleq 2 D
\(y = x^2 - 4\)

\(y = 2x + 4\)

If \((x, y)\) is a solution to the system of equations above and \(x > 0\), what is the value of \(y\)?
A) \(4\)
B) \(8\)
C) \(0\)
D) \(12\)
= Set the equations equal: \(x^2 - 4 = 2x + 4\), so \(x^2 - 2x - 8 = 0\) and \((x - 4)(x + 2) = 0\). With \(x > 0\), \(x = 4\) and \(y = 2(4) + 4 = 12\).

### m-nleq 2 A
How many distinct real solutions does the equation \(2x^2 - 4x + 5 = 0\) have?
A) Zero
B) Exactly one
C) Exactly two
D) Infinitely many
= The discriminant is \(b^2 - 4ac = 16 - 40 = -24\). A negative discriminant means no real solutions.

### m-nleq 3 C
In the equation \(x^2 - kx + 16 = 0\), \(k\) is a positive constant. If the equation has exactly one real solution, what is the value of \(k\)?
A) \(4\)
B) \(16\)
C) \(8\)
D) \(32\)
= Exactly one real solution means the discriminant is 0: \(k^2 - 4(1)(16) = 0\), so \(k^2 = 64\) and \(k = 8\).

### m-nleq 3 =4
What is the sum of the solutions to \(3x^2 - 12x - 7 = 0\)?
= For \(ax^2 + bx + c = 0\), the sum of the solutions is \(-\frac{b}{a} = -\frac{-12}{3} = 4\).

### m-nleq 3 B
What is the positive solution to \(\frac{6}{x} + \frac{6}{x + 3} = 3\)?
A) \(2\)
B) \(3\)
C) \(6\)
D) \(9\)
= Multiply by \(x(x + 3)\): \(6(x + 3) + 6x = 3x(x + 3)\), so \(12x + 18 = 3x^2 + 9x\). Then \(3x^2 - 3x - 18 = 0\), or \((x - 3)(x + 2) = 0\). The positive solution is 3.

### m-nlf 1 D
The function \(f\) is defined by \(f(x) = x^2 + 3x\). What is the value of \(f(4)\)?
A) \(11\)
B) \(19\)
C) \(24\)
D) \(28\)
= Substitute 4 for \(x\): \(f(4) = 4^2 + 3(4) = 16 + 12 = 28\).

### m-nlf 1 B
A population of bacteria doubles every hour. There are 500 bacteria now. Which function gives the number of bacteria, \(P\), after \(t\) hours?
A) \(P(t) = 500 + 2t\)
B) \(P(t) = 500(2)^t\)
C) \(P(t) = 2(500)^t\)
D) \(P(t) = 500t^2\)
= Doubling every hour is exponential growth with a starting value of 500 and a growth factor of 2.

### m-nlf 1 =13
The function \(g\) is defined by \(g(x) = 2^x + 5\). What is the value of \(g(3)\)?
= \(g(3) = 2^3 + 5 = 8 + 5 = 13\).

### m-nlf 2 C
In the xy-plane, what are the coordinates of the vertex of the graph of \(y = (x - 2)^2 - 9\)?
A) \((-2, -9)\)
B) \((2, 9)\)
C) \((2, -9)\)
D) \((-9, 2)\)
= In vertex form \(y = (x - h)^2 + k\), the vertex is \((h, k) = (2, -9)\).

### m-nlf 2 A
The value of a car is modeled by \(V(t) = 24{,}000(0.85)^t\), where \(V(t)\) is the value in dollars \(t\) years after it was purchased. Which statement is the best interpretation of 0.85 in this context?
A) The car's value decreases by 15% each year.
B) The car's value decreases by 85% each year.
C) The car's value decreases by $0.85 each year.
D) The car was purchased for 85% of its original price.
= Each year the value is multiplied by 0.85, meaning it keeps 85% and loses \(100\% - 85\% = 15\%\).

### m-nlf 2 =-4
The function \(f\) is defined by \(f(x) = x^2 - 6x + 5\). What is the minimum value of \(f(x)\)?
= The vertex is at \(x = -\frac{b}{2a} = 3\). Then \(f(3) = 9 - 18 + 5 = -4\).

### m-nlf 2 D
What are the x-intercepts of the graph of \(y = x^2 - x - 12\) in the xy-plane?
A) \((-4, 0)\) and \((3, 0)\)
B) \((0, -12)\) only
C) \((12, 0)\) and \((-1, 0)\)
D) \((-3, 0)\) and \((4, 0)\)
= Set \(y = 0\): \(x^2 - x - 12 = (x - 4)(x + 3) = 0\), so \(x = 4\) or \(x = -3\).

### m-nlf 3 B
The function \(f\) is defined by \(f(x) = a(x - 1)(x - 7)\), where \(a\) is a constant. The graph of \(y = f(x)\) passes through the point \((3, 24)\). What is the y-coordinate of the vertex of the graph?
A) \(24\)
B) \(27\)
C) \(-27\)
D) \(36\)
= From \(f(3) = a(2)(-4) = -8a = 24\), \(a = -3\). The vertex is midway between the zeros 1 and 7, at \(x = 4\): \(f(4) = -3(3)(-3) = 27\).

### m-nlf 3 =135
For an exponential function \(f(x) = ab^x\), where \(a\) and \(b\) are constants and \(b > 0\), \(f(0) = 5\) and \(f(2) = 45\). What is the value of \(f(3)\)?
= \(f(0) = a = 5\). Then \(5b^2 = 45\), so \(b^2 = 9\) and \(b = 3\). So \(f(3) = 5 \cdot 27 = 135\).

### m-nlf 3 C
The functions \(f\) and \(g\) are defined by \(f(x) = 2x + 1\) and \(g(x) = x^2 - 3\). If \(f(g(x)) = 15\) and \(x > 0\), what is the value of \(x\)?
A) \(\sqrt{7}\)
B) \(10\)
C) \(\sqrt{10}\)
D) \(\sqrt{13}\)
= \(f(g(x)) = 2(x^2 - 3) + 1 = 2x^2 - 5\). Setting \(2x^2 - 5 = 15\) gives \(x^2 = 10\), so \(x = \sqrt{10}\).

### m-ratio 1 B
A recipe uses 3 cups of flour for every 2 cups of sugar. How many cups of flour are needed for 8 cups of sugar?
A) \(10\)
B) \(12\)
C) \(16\)
D) \(24\)
= The sugar is multiplied by 4 (from 2 to 8), so the flour is too: \(3 \times 4 = 12\) cups.

### m-ratio 2 =14
A car travels 150 miles on 5 gallons of gasoline. At this rate, how many gallons of gasoline would the car need to travel 420 miles?
= The car gets \(150 \div 5 = 30\) miles per gallon, so it needs \(420 \div 30 = 14\) gallons.

### m-ratio 2 C
A runner's pace is 8 minutes per mile. What is the runner's speed, in miles per hour?
A) \(6.5\)
B) \(8\)
C) \(7.5\)
D) \(13.3\)
= There are 60 minutes in an hour, so the runner covers \(60 \div 8 = 7.5\) miles per hour.

### m-ratio 3 D
There are 1,000 liters in 1 cubic meter. A pool that holds 450 cubic meters of water is being filled at a rate of 250 liters per minute. How many hours will it take to fill the empty pool?
A) \(1.8\)
B) \(18\)
C) \(300\)
D) \(30\)
= 450 cubic meters is 450,000 liters. At 250 liters per minute, that takes \(1{,}800\) minutes, or \(1{,}800 \div 60 = 30\) hours.

### m-pct 1 A
What is 30% of 250?
A) \(75\)
B) \(25\)
C) \(220\)
D) \(750\)
= Write 30% as the decimal 0.30 and multiply: \(0.30 \times 250 = 75\).

### m-pct 2 =52
A jacket originally priced at $80 is on sale for 35% off. What is the sale price, in dollars?
= A 35% discount leaves 65% of the price: \(0.65 \times 80 = 52\).

### m-pct 2 B
The number of members in a club increased from 240 to 300. By what percent did membership increase?
A) 20%
B) 25%
C) 60%
D) 80%
= Percent increase is the change divided by the original: \(\frac{300 - 240}{240} = \frac{60}{240} = 0.25\), or 25%. Choice A divides by the new value by mistake.

### m-pct 3 C
A store raised the price of a lamp by 20%. Later, it lowered the new price by 20%. The final price is what percent of the original price?
A) 100%
B) 80%
C) 96%
D) 104%
= Multiply the factors: \(1.20 \times 0.80 = 0.96\). The 20% decrease applies to a larger number, so the price does not return to 100%.

### m-data1 1 D
What is the mean of the data set 4, 7, 7, 9, 13?
A) \(7\)
B) \(9\)
C) \(13\)
D) \(8\)
= The sum is \(4 + 7 + 7 + 9 + 13 = 40\). There are 5 values, so the mean is \(40 \div 5 = 8\). Choice A is the median and mode.

### m-data1 2 B
A data set consists of the values 12, 15, 15, 18, 20, 21, and 40. If the value 40 is removed, which statement about the data set is true?
A) The mean and the median both increase.
B) The mean decreases by more than the median does.
C) The median decreases, but the mean does not change.
D) Neither the mean nor the median changes.
= Before: mean \(= 141 \div 7 \approx 20.1\), median \(= 18\). After: mean \(= 101 \div 6 \approx 16.8\), median \(= \frac{15 + 18}{2} = 16.5\). The mean drops about 3.3 and the median drops 1.5. Removing an outlier affects the mean more.

### m-data1 3 =24
The mean of five numbers is 12. When a sixth number is added, the mean of the six numbers is 14. What is the sixth number?
= The five numbers sum to \(5 \times 12 = 60\). The six numbers sum to \(6 \times 14 = 84\). The sixth number is \(84 - 60 = 24\).

### m-data2 1 A
The line of best fit for a scatterplot showing a plant's height \(h\), in centimeters, \(t\) weeks after planting is \(h = 2.5t + 4\). Based on the line of best fit, what is the predicted height of the plant, in centimeters, 6 weeks after planting?
A) \(19\)
B) \(15\)
C) \(25\)
D) \(10.5\)
= \(h = 2.5(6) + 4 = 15 + 4 = 19\).

### m-data2 2 C
A scatterplot shows the number of hours students studied, \(x\), and their test scores, \(y\). The line of best fit is \(y = 4.2x + 61\). Which statement is the best interpretation of 4.2 in this context?
A) The predicted score for a student who studies 0 hours is 4.2.
B) A student must study 4.2 hours to score 61.
C) For each additional hour studied, the predicted test score increases by 4.2 points.
D) Students studied an average of 4.2 hours.
= 4.2 is the slope: the change in predicted score for each 1-hour increase in study time. The predicted score at 0 hours is 61, the y-intercept.

### m-data2 3 D
TABLE: Values of x and y
x | 0 | 1 | 2 | 3
y | 3 | 6 | 12 | 24
Which equation best models the relationship between \(x\) and \(y\) shown in the table?
A) \(y = 3x + 3\)
B) \(y = 6x\)
C) \(y = 3x^2\)
D) \(y = 3(2)^x\)
= Each time \(x\) increases by 1, \(y\) doubles, which is exponential growth with a starting value of 3. Check: \(3(2)^3 = 24\). A linear model would add the same amount each step.

### m-prob 1 B
A bag contains 4 red marbles, 6 blue marbles, and 10 green marbles. If one marble is selected at random, what is the probability that it is blue?
A) \(0.2\)
B) \(0.3\)
C) \(0.5\)
D) \(0.6\)
= There are 20 marbles in total, and 6 are blue: \(\frac{6}{20} = 0.3\).

### m-prob 2 =0.56|14/25
TABLE: Class-time preference of 200 students
Grade | Morning | Afternoon | Total
10th | 45 | 55 | 100
11th | 30 | 70 | 100
Total | 75 | 125 | 200
The table shows the results of a survey. If a student who prefers afternoon classes is selected at random, what is the probability that the student is in 11th grade? (Enter your answer as a decimal or a fraction.)
= Only the 125 students who prefer afternoon count. Of those, 70 are in 11th grade: \(\frac{70}{125} = 0.56\).

### m-prob 3 C
Two fair six-sided dice are rolled. What is the probability that the sum of the numbers rolled is 8?
A) \(\frac{1}{6}\)
B) \(\frac{1}{9}\)
C) \(\frac{5}{36}\)
D) \(\frac{2}{9}\)
= There are 36 equally likely outcomes. A sum of 8 comes from (2,6), (3,5), (4,4), (5,3), and (6,2), which is 5 outcomes, so the probability is \(\frac{5}{36}\).

### m-infer 1 A
A random sample of 300 voters in a city was surveyed, and 180 said they support building a new park. Based on the survey, which is the best estimate of the percent of all voters in the city who support the park?
A) 60%
B) 40%
C) 18%
D) 180%
= \(\frac{180}{300} = 0.6\), or 60%. A random sample can be used to estimate the whole population.

### m-infer 2 D
A survey of 500 randomly selected adults found that 34% exercise daily. The margin of error for the estimate is 4%. Which conclusion is most appropriate?
A) Exactly 34% of all adults exercise daily.
B) The true percentage of adults who exercise daily is 38%.
C) Fewer than 30% of all adults exercise daily.
D) It is plausible that between 30% and 38% of all adults exercise daily.
= A margin of error gives a range of plausible values: \(34\% \pm 4\%\), or 30% to 38%. A sample cannot show an exact population value.

### m-infer 3 B
Researchers randomly assigned 200 volunteers to take either a new sleep supplement or a placebo. On average, the supplement group fell asleep significantly faster than the placebo group. Which conclusion is best supported by the study?
A) The supplement will make every person fall asleep faster.
B) The supplement is likely to cause people similar to the volunteers to fall asleep faster.
C) The supplement has no effect on how quickly people fall asleep.
D) The results apply only to people who did not volunteer.
= Random assignment supports a cause-and-effect conclusion, but only for people like those studied (volunteers), and only on average, not for every person.

### m-area 1 C
A rectangle has a length of 12 centimeters and a width of 5 centimeters. What is the area of the rectangle, in square centimeters?
A) \(17\)
B) \(34\)
C) \(60\)
D) \(120\)
= Area is length times width: \(12 \times 5 = 60\). Choice B is the perimeter.

### m-area 1 =64
A cube has an edge length of 4 inches. What is the volume of the cube, in cubic inches?
= The volume of a cube is its edge length cubed: \(V = s^3 = 4^3 = 64\).

### m-area 2 A
A right circular cylinder has a radius of 3 meters and a height of 10 meters. What is the volume of the cylinder, in cubic meters?
A) \(90\pi\)
B) \(30\pi\)
C) \(60\pi\)
D) \(900\pi\)
= \(V = \pi r^2 h = \pi(9)(10) = 90\pi\).

### m-area 2 D
A rectangular garden is 3 times as long as it is wide. The area of the garden is 75 square feet. What is the perimeter of the garden, in feet?
A) \(20\)
B) \(30\)
C) \(50\)
D) \(40\)
= If the width is \(w\), then \(3w \cdot w = 75\), so \(w^2 = 25\) and \(w = 5\). The length is 15, so the perimeter is \(2(5 + 15) = 40\).

### m-area 3 =36
A sphere has a volume of \(36\pi\) cubic units. The surface area of the sphere is \(k\pi\) square units. What is the value of \(k\)?
= \(\frac{4}{3}\pi r^3 = 36\pi\) gives \(r^3 = 27\), so \(r = 3\). The surface area is \(4\pi r^2 = 36\pi\), so \(k = 36\).

### m-tri 1 B
Two angles of a triangle measure 50° and 65°. What is the measure of the third angle?
A) 55°
B) 65°
C) 75°
D) 115°
= The angles of a triangle sum to 180°: \(180 - 50 - 65 = 65\).

### m-tri 1 D
Two parallel lines are cut by a transversal, and one of the angles formed measures 70°. Each angle formed is either congruent to the 70° angle or supplementary to it. What is the measure of each angle that is not congruent to the 70° angle?
A) 20°
B) 70°
C) 90°
D) 110°
= Supplementary angles sum to 180°: \(180 - 70 = 110\).

### m-tri 2 =15
Triangle \(ABC\) is similar to triangle \(DEF\), where \(A\), \(B\), and \(C\) correspond to \(D\), \(E\), and \(F\), respectively. If \(AB = 6\), \(BC = 9\), and \(DE = 10\), what is the length of \(EF\)?
= Corresponding sides are proportional: \(\frac{EF}{BC} = \frac{DE}{AB}\), so \(EF = 9 \cdot \frac{10}{6} = 15\).

### m-tri 2 A
In isosceles triangle \(PQR\), \(PQ = PR\) and angle \(Q\) measures 72°. What is the measure of angle \(P\)?
A) 36°
B) 72°
C) 54°
D) 108°
= Since \(PQ = PR\), the angles opposite those sides (angles \(R\) and \(Q\)) are equal, so each is 72°. Then angle \(P = 180 - 144 = 36\).

### m-tri 3 C
In triangle \(JKL\), angle \(J\) measures 40° and angle \(K\) measures 75°. Point \(M\) lies on side \(KL\) so that segment \(JM\) bisects angle \(J\). What is the measure of angle \(JMK\)?
A) 65°
B) 75°
C) 85°
D) 95°
= The bisector splits angle \(J\) into two 20° angles. In triangle \(JKM\), the angles are 20° and 75°, so angle \(JMK = 180 - 20 - 75 = 85\).

### m-trig 1 B
A right triangle has legs of lengths 6 and 8. What is the length of the hypotenuse?
A) \(9\)
B) \(10\)
C) \(14\)
D) \(100\)
= Pythagorean theorem: \(\sqrt{6^2 + 8^2} = \sqrt{100} = 10\).

### m-trig 2 D
In right triangle \(ABC\), angle \(C\) is the right angle, \(AC = 5\), \(BC = 12\), and \(AB = 13\). What is the value of \(\sin A\)?
A) \(\frac{5}{13}\)
B) \(\frac{5}{12}\)
C) \(\frac{12}{5}\)
D) \(\frac{12}{13}\)
= Sine is opposite over hypotenuse. The side opposite angle \(A\) is \(BC = 12\), so \(\sin A = \frac{12}{13}\).

### m-trig 2 =3/5|0.6
In a right triangle, one acute angle measures \(x°\), and \(\sin(x°) = \frac{3}{5}\). What is the value of \(\cos((90 - x)°)\)?
= The sine of an angle equals the cosine of its complement: \(\cos((90 - x)°) = \sin(x°) = \frac{3}{5}\).

### m-trig 2 A
The shortest side of a 30°-60°-90° triangle has length 7. What is the length of the longest side?
A) \(14\)
B) \(7\sqrt{3}\)
C) \(7\sqrt{2}\)
D) \(21\)
= In a 30°-60°-90° triangle, the sides are in the ratio \(1 : \sqrt{3} : 2\). The hypotenuse is twice the shortest side: 14.

### m-trig 3 C
An isosceles right triangle has a perimeter of \(20 + 10\sqrt{2}\). What is the length of its hypotenuse?
A) \(10\)
B) \(20\)
C) \(10\sqrt{2}\)
D) \(20\sqrt{2}\)
= If each leg is \(a\), the hypotenuse is \(a\sqrt{2}\), so the perimeter is \(2a + a\sqrt{2}\). Matching \(20 + 10\sqrt{2}\) gives \(a = 10\), so the hypotenuse is \(10\sqrt{2}\).

### m-circ 1 A
A circle has a radius of 6. What is the area of the circle?
A) \(36\pi\)
B) \(12\pi\)
C) \(6\pi\)
D) \(144\pi\)
= \(A = \pi r^2 = 36\pi\). Choice B is the circumference.

### m-circ 2 C
What are the center and radius of the circle with equation \((x - 3)^2 + (y + 2)^2 = 49\)?
A) Center \((-3, 2)\), radius 7
B) Center \((3, -2)\), radius 49
C) Center \((3, -2)\), radius 7
D) Center \((-3, 2)\), radius 49
= In \((x - h)^2 + (y - k)^2 = r^2\), the center is \((h, k) = (3, -2)\) and \(r = \sqrt{49} = 7\).

### m-circ 2 =9
A circle has a circumference of \(18\pi\). What is the radius of the circle?
= \(C = 2\pi r = 18\pi\), so \(r = 9\).

### m-circ 3 B
A circle has a radius of 10. A central angle of the circle measures 72°. What is the length of the arc intercepted by the angle?
A) \(2\pi\)
B) \(4\pi\)
C) \(20\pi\)
D) \(8\pi\)
= The arc is \(\frac{72}{360} = \frac{1}{5}\) of the circumference \(20\pi\), so its length is \(4\pi\).

### m-circ 3 =6
The equation \(x^2 + y^2 - 6x + 8y = 11\) defines a circle in the xy-plane. What is the radius of the circle?
= Complete the square: \((x - 3)^2 + (y + 4)^2 = 11 + 9 + 16 = 36\). So \(r = \sqrt{36} = 6\).
`;

  function parse(bank) {
    const counters = {};
    return bank.split(/^### /m).slice(1).map((block) => {
      const lines = block.replace(/\s+$/, '').split('\n');
      const [skill, diff, ans] = lines.shift().trim().split(/\s+/);
      const body = [], choices = [];
      let table = null, expl = null;
      lines.forEach((line) => {
        if (expl !== null) { expl += ' ' + line.trim(); return; }
        const m = /^([A-D])\) (.*)$/.exec(line);
        if (m) choices.push(m[2]);
        else if (line.startsWith('= ')) expl = line.slice(2).trim();
        else if (line.startsWith('TABLE: ')) table = { title: line.slice(7).trim(), headers: null, rows: [] };
        else if (table && line.includes('|')) {
          const cells = line.split('|').map((c) => c.trim());
          if (!table.headers) table.headers = cells; else table.rows.push(cells);
        } else body.push(line);
      });
      counters[skill] = (counters[skill] || 0) + 1;
      const spr = ans.startsWith('=');
      return {
        id: skill + '-' + String(counters[skill]).padStart(3, '0'),
        skill,
        difficulty: Number(diff),
        type: spr ? 'spr' : 'mc',
        passage: body.join('\n').trim(),
        table,
        question: '',
        choices: spr ? null : choices,
        answer: spr ? null : 'ABCD'.indexOf(ans),
        answers: spr ? ans.slice(1).split('|') : null,
        explanation: expl || '',
      };
    });
  }

  window.SAT_SKILLS = (window.SAT_SKILLS || []).concat(SKILLS);
  window.SAT_QUESTIONS = (window.SAT_QUESTIONS || []).concat(parse(BANK));
})();

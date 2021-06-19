
// Multiplication which adds distortion
// Static variables are supported too
int multiply(int i, int j)
{
  static int distortion = 0;
  int result = i * j + distortion;
  distortion++;
  return result;
}


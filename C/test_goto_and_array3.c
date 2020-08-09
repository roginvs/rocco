volatile int q = 0;
int main() {

    if (q == 0) {
        goto label1;
    }


    char arr[q];

    label1:;

    arr[1] = 2;

    return 3;

}